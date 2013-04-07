package com.equ.app.travel;

import java.io.InputStream;
import java.util.Collection;
import java.util.Comparator;
import java.util.Date;
import java.util.HashMap;
import java.util.List;
import java.util.TreeSet;

import javax.ws.rs.Consumes;
import javax.ws.rs.GET;
import javax.ws.rs.POST;
import javax.ws.rs.Path;
import javax.ws.rs.PathParam;
import javax.ws.rs.Produces;
import javax.ws.rs.core.MediaType;

import com.google.appengine.api.datastore.GeoPt;
import com.googlecode.objectify.Key;
import com.googlecode.objectify.NotFoundException;
import com.googlecode.objectify.Objectify;
import com.googlecode.objectify.ObjectifyService;
import com.googlecode.objectify.annotation.Embed;
import com.googlecode.objectify.annotation.Entity;
import com.googlecode.objectify.annotation.Index;
import com.sun.jersey.multipart.FormDataParam;
import com.yy.app.AModel;
import com.yy.app.auth.User;
import com.yy.app.test.Test;
import com.yy.app.test.TestValue;
import com.yy.rs.Caps;
import com.yy.util.CellLocation;

@Entity
public class Track extends AModel {
	static class TimedPointComparaor implements Comparator<TimedPoint>{

		@Override
		public int compare(TimedPoint a, TimedPoint b) {
			return a.hashCode()-b.hashCode();
		}
		
	}
	@Index
	public Long start;
	@Index
	public Long end;
	
	@Embed
	private TreeSet<TimedPoint> points=new TreeSet<TimedPoint>(new TimedPointComparaor());
	
	public TreeSet<TimedPoint> getPoints(){
		return this.points;
	}
	
	public void add(TimedPoint tp){
		points.add(tp);
	}

	@Override
	protected void prePersist() {
		super.prePersist();
		if(points.isEmpty())
			return;
		if(start==null)
			start=points.first().time.getTime();
		end=points.last().time.getTime();
	}
	
	public Track tryMerge(){
		if(points.size()<80){
			Track latest=ObjectifyService.ofy().load().type(Track.class).filter("author", User.getCurrentUserID()).first().get();
			if(latest!=null && latest.points.size()<80 && latest.end>points.first().time.getTime()){
				latest.points.addAll(points);
				return latest;
			}
		}
		return this;
	}
	
	@Path("track")
	public static class View extends AModel.View{
		@Test
		@GET
		@Path("{author:\\d+}/{start:\\d+}/{end:\\d+}")
		@Produces(MediaType.APPLICATION_JSON)
		public Collection<TimedPoint> search(
				 @TestValue("1") @PathParam("author") long user,
				 @TestValue("1000") @PathParam("start") long start, 
				 @TestValue("9999") @PathParam("end") long end){
			if(end==Long.MAX_VALUE)
				return search(user,start);
			
			Objectify store=ObjectifyService.ofy();
			
			List<Key<Track>> startIDs, endIDs;
			int limit=0;
			
			do{
				limit+=5;
				endIDs=store.load().type(Track.class)
					.filter("end <= ", end)
					.filter("author", user)
					.limit(limit).keys().list();
				
				startIDs=store.load().type(Track.class)
					.filter("start >= ", start)
					.filter("author", user)
					.limit(limit).keys().list();

				startIDs.retainAll(endIDs);
			}while(startIDs.size()==limit);
			
			switch(startIDs.size()){
			case 0:
				return new TreeSet<TimedPoint>(new TimedPointComparaor());
			case 1:
				return store.load().key(startIDs.get(0)).get().points;
			default:
				TreeSet<TimedPoint> points=new TreeSet<TimedPoint>(new TimedPointComparaor());
				for(Track al: store.load().keys(startIDs).values())
					points.addAll(al.points);
				return points;
			}
		}
		
		@Test
		@GET
		@Path("{author:\\d+}/{start:\\d+}")
		@Produces(MediaType.APPLICATION_JSON)
		public Collection<TimedPoint> search(
				@TestValue("1") @PathParam("author") long user,
				@TestValue("1000") @PathParam("start") long start){
			Objectify store=ObjectifyService.ofy();
			List<Track> locus=store.load().type(Track.class)
				.filter("start >= ", start)
				.filter("author", user)
				.list();
			switch(locus.size()){
			case 0:
				return new TreeSet<TimedPoint>(new TimedPointComparaor());
			case 1:
				return locus.get(0).points;
			default:
				TreeSet<TimedPoint> points=new TreeSet<TimedPoint>(new TimedPointComparaor());
				for(Track al: locus)
					points.addAll(al.points);
				return points;
			}
		}
		
		@GET
		@Path("vacation/{planID:\\d+}/{author:\\d+}")
		@Produces(MediaType.APPLICATION_JSON)
		public Collection<TimedPoint> planTrack(
				@PathParam("planID")long ID,
				@PathParam("author")long user){
			Vacation v=ObjectifyService.ofy().load().type(Vacation.class).id(ID).get();
			if(v.started()){
				return search(user,v.start.getTime(), v.end==null ? Long.MAX_VALUE : v.end.getTime());
			}else
				return null;
		}
		
		@GET
		@Path("vacation/{planID:\\d+}")
		@Produces(MediaType.APPLICATION_JSON)
		@Caps
		public Collection<TimedPoint> planTrack(
				@PathParam("planID")long ID){
			Vacation v=ObjectifyService.ofy().load().type(Vacation.class).id(ID).get();
			if(v.started())
				return search(User.getCurrentUserID(),v.start.getTime(), v.end!=null ? v.end.getTime() : Long.MAX_VALUE);
			else
				return null;
		}

		@POST
		@Path("upload")
		@Consumes(MediaType.MULTIPART_FORM_DATA)
		@Produces(MediaType.APPLICATION_JSON)
		@Caps
		public Collection<TimedPoint> upload(@FormDataParam("file") InputStream fileStream) {
			HashMap<String,GeoPt> caches=new HashMap<String,GeoPt>();
			try {
				int readLen = 0;
				int startAt = 0;
				int endAt = 0;
				byte buffer[] = new byte[1024];

				String aRead;
				String[] locRawData;
				TimedPoint aLoc=null;
				String lastLeft=null;

				Objectify service = ObjectifyService.ofy();
				Track track=new Track();

				while ((readLen = fileStream.read(buffer)) != -1) { 
					startAt = 0;
					endAt = readLen - 1;
					
					if(lastLeft==null)
						while (buffer[startAt] != '[')
							startAt++;
						
					while (buffer[endAt] != ']')
						endAt--;
					
					aRead=new String(buffer, startAt, endAt);
					
					if(lastLeft!=null)
						aRead=lastLeft+aRead;
					
					locRawData = aRead.split("\\],");
					
					for (String loc : locRawData) {
						aLoc = createTP(loc, caches);
						if (aLoc != null)
							track.points.add(aLoc);
					}
					
					while(readLen-1>endAt+1 && buffer[endAt+1]!='[')
						endAt++;
						
					lastLeft=readLen-1-endAt>0 ? new String(buffer,endAt+1,readLen-1-endAt) : null;
				}
				
				if(!track.points.isEmpty()){
					track=track.tryMerge();
					service.save().entity(track);
				}
				
				return track.points;
			} catch (Exception e) {
				throw new RuntimeException(e.getMessage(),e);
			}
		}
		
		private TimedPoint createTP(String loc, HashMap<String,GeoPt> caches) {
			if ((loc = loc.trim()).length() == 0)
				return null;
			loc=loc.replaceAll("[\\[\\]]", "");
			String[] cellInfo = loc.split(",");
			if (cellInfo.length < 3)
				return null;
			
			try {
				TimedPoint aLoc = new TimedPoint();
				aLoc.time = new Date();
				aLoc.time.setTime(Long.parseLong(cellInfo[0]));
				
				if (cellInfo[1].indexOf('.') != -1
						|| cellInfo[2].indexOf('.') != -1) {
					aLoc.pt = new GeoPt(Float.parseFloat(cellInfo[1]), Float.parseFloat(cellInfo[2]));
				}else{
					String ID=cellInfo[1];
					for(int i=2; i<cellInfo.length; i++)
						ID=ID+","+cellInfo[i];
					
					if(caches.containsKey(ID))
						aLoc.pt=caches.get(ID);
					else{
						CellPoint cp;
						try{
							cp=ObjectifyService.ofy().load().type(CellPoint.class).id(ID).get();
							aLoc.pt=cp.pt;
						}catch(NotFoundException ex){
							float[] latlng = CellLocation.convertCell2Latlng(
									Integer.parseInt(cellInfo[1]),
									Integer.parseInt(cellInfo[2]));
							aLoc.pt = new GeoPt(latlng[0], latlng[1]);
							cp=new CellPoint(ID, aLoc.pt);
							ObjectifyService.ofy().save().entity(cp).now();
						}
						caches.put(ID, aLoc.pt);
					}
					aLoc.type=1;
				}
				
				return aLoc;
			} catch (Exception e) {
				return null;
			}
		}
	}
}

