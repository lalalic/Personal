package com.equ.app.travel;

import java.text.DateFormat;
import java.text.SimpleDateFormat;
import java.util.ArrayList;
import java.util.Date;
import java.util.List;
import java.util.Map;
import java.util.logging.Logger;

import javax.persistence.Id;
import javax.persistence.PrePersist;
import javax.servlet.http.HttpServletRequest;
import javax.ws.rs.Consumes;
import javax.ws.rs.DefaultValue;
import javax.ws.rs.GET;
import javax.ws.rs.POST;
import javax.ws.rs.Path;
import javax.ws.rs.PathParam;
import javax.ws.rs.Produces;
import javax.ws.rs.core.Context;
import javax.ws.rs.core.MediaType;

import com.google.appengine.api.blobstore.BlobKey;
import com.google.appengine.api.blobstore.BlobstoreService;
import com.google.appengine.api.blobstore.BlobstoreServiceFactory;
import com.google.appengine.api.datastore.GeoPt;
import com.googlecode.objectify.Objectify;
import com.googlecode.objectify.ObjectifyService;
import com.googlecode.objectify.annotation.Indexed;
import com.googlecode.objectify.annotation.Unindexed;
import com.sun.jersey.multipart.FormDataParam;
import com.yy.app.auth.User;
import com.yy.app.media.Resource;
import com.yy.app.test.Test;
import com.yy.app.test.TestValue;
import com.yy.photo.Jpeg;
import com.yy.rs.Caps;

@Unindexed
public class Photo{
	private static final DateFormat takenParser = new SimpleDateFormat("yyyy:M:d H:m:s");
	protected static final Logger log = Logger.getLogger(Photo.class.getName());
	@Id
	public String ID;//same as resource.ID
	public String title;
	@Indexed
	public GeoPt loc;
	@Indexed
	public Date taken;
	@Indexed
	public long author;
	
	public String getUrl(){
		return "/media/show/" + ID + ".jpg";
	}
	
	void parse(String info){
		float lat=0f,lng=0f;
		int i=info.lastIndexOf(',');
		taken=new Date(Long.parseLong(info.substring(i)));
		
		info=info.substring(0,i);
		i=info.lastIndexOf(',');
		try {
			lng=Float.parseFloat(info.substring(i));
		} catch (NumberFormatException e) {
			
		}
		
		info=info.substring(0,i);
		i=info.lastIndexOf(',');
		try {
			lat=Float.parseFloat(info.substring(i));
		} catch (NumberFormatException e) {
			
		}
		
		if(lat!=0 && lng!=0)
			loc=new GeoPt(lat,lng);
		
		title=info.substring(0,i);
	}
	
	@PrePersist
	protected void prePersit(){
		this.author=User.getCurrentUserID();
	}
	
	@Path("p")
	public static class View{
		@POST
		@Path("upload")
		@Consumes(MediaType.MULTIPART_FORM_DATA)
		@Produces(MediaType.APPLICATION_JSON)
		@Caps
		public List<Photo> upload(
				@FormDataParam("info") @DefaultValue("") String[] infos,
				@FormDataParam("lat") @DefaultValue("0")float lat,
				@FormDataParam("lng") @DefaultValue("0")float lng,
				@FormDataParam("vID") @DefaultValue("0")long vID,
				@FormDataParam("date") @DefaultValue("0")long taken,
				@Context HttpServletRequest request){
			Objectify store=ObjectifyService.begin();
			BlobstoreService service = BlobstoreServiceFactory.getBlobstoreService();
			Map<String, List<BlobKey>> uploads = service.getUploads(request);
			if(uploads==null || uploads.isEmpty())
				return null;
			
			List<Object> models=new ArrayList<Object>();
			List<Photo> photos=new ArrayList<Photo>();
			Track track=new Track();
			int i=0;
			GeoPt defaultPt=null;
			if(lat!=0 && lng!=0)
				defaultPt=new GeoPt(lat,lng);
			long currentUser=User.getCurrentUserID();
			for (BlobKey key : uploads.get("file")) {
				Resource res = store.get(Resource.class,
						key.getKeyString());
				
				Photo p=new Photo();
				p.ID=res.ID;
				if(infos!=null){//from mobile
					p.parse(infos[i]);
					if(p.loc!=null)
						track.add(new TimedPoint(p.taken,p.loc));
				}
				
				if(p.loc==null && defaultPt!=null)
					p.loc=defaultPt;
				
				if(p.taken==null){
					//1.file name, yyyymmdd, yyyy-mm-dd
					//2.exif
					p.taken=getTaken(service.fetchData(key, 0l,res.size>Jpeg.M_MAX_COM_LENGTH ? Jpeg.M_MAX_COM_LENGTH : res.size-1));
					//3.date
				}
				p.author=currentUser;
				models.add(p);
				photos.add(p);
				i++;
			}

			if(track.getPoints().size()>0){
				track=track.tryMerge();
				models.add(track);
			}
			store.put(models);
			return photos;
		}
		
		private Date getTaken(byte[] data){
		    try {
				Jpeg j=new Jpeg(data);
				String taken=j.getTag(Jpeg.EXIF_TAKEN);
			    if(taken!=null)
			    	return takenParser.parse(taken);
			} catch (Exception ex) {
				log.warning(ex.getMessage());
			}
			return null;
		}
		

		@Test
		@GET
		@Path("{author:\\d+}/{start:\\d+}/{end:\\d+}")
		@Produces(MediaType.APPLICATION_JSON)
		public List<Photo> search(
				@TestValue("1") @PathParam("author") long user,
				@TestValue("1000") @PathParam("start")long start, 
				@TestValue("9999") @PathParam("end")long end){
			if(end==Long.MAX_VALUE)
				end=new Date().getTime()+24*60*60*1000;
			Objectify store=ObjectifyService.begin();
			List<Photo> ps=store.query(Photo.class)
				.filter("taken >= ", new Date(start))
				.filter("taken <= ", new Date(end))
				.filter("author", user)
				.list();
			return ps;
		}
		
		@GET
		@Path("{author:\\d+}/{start:\\d+}")
		@Produces(MediaType.APPLICATION_JSON)
		@Test
		public List<Photo> search(
				@TestValue("1") @PathParam("author") long user,
				@TestValue("1000") @PathParam("start") long start){
			return search(user,start,Long.MAX_VALUE); 
		}	
		
		@GET
		@Path("vacation/{planID:\\d+}/{author:\\d+}")
		@Produces(MediaType.APPLICATION_JSON)
		public List<Photo> planPhoto(
				@PathParam("planID")long ID,
				@PathParam("author")long user){
			Vacation v=ObjectifyService.begin().get(Vacation.class, ID);
			if(v.started())
				return search(user,v.start.getTime(), v.end!=null ? v.end.getTime() : Long.MAX_VALUE);
			else
				return null;
		}
		
		@GET
		@Path("vacation/{planID:\\d+}")
		@Produces(MediaType.APPLICATION_JSON)
		public List<Photo> planPhoto(
				@PathParam("planID")long ID){
			Vacation v=ObjectifyService.begin().get(Vacation.class, ID);
			if(v.started())
				return search(User.getCurrentUserID(),v.start.getTime(), v.end!=null ? v.end.getTime() : Long.MAX_VALUE);
			else
				return null;
		}
	}
}
