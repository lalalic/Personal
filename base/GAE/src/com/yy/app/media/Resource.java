package com.yy.app.media;

import java.io.IOException;
import java.util.ArrayList;
import java.util.Date;
import java.util.List;
import java.util.Map;

import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import javax.ws.rs.Consumes;
import javax.ws.rs.GET;
import javax.ws.rs.POST;
import javax.ws.rs.Path;
import javax.ws.rs.PathParam;
import javax.ws.rs.Produces;
import javax.ws.rs.core.Context;
import javax.ws.rs.core.MediaType;
import javax.ws.rs.core.UriInfo;

import com.google.appengine.api.blobstore.BlobKey;
import com.google.appengine.api.blobstore.BlobstoreService;
import com.google.appengine.api.blobstore.BlobstoreServiceFactory;
import com.googlecode.objectify.Objectify;
import com.googlecode.objectify.ObjectifyService;
import com.googlecode.objectify.annotation.Entity;
import com.googlecode.objectify.annotation.Id;

import com.sun.jersey.api.view.Viewable;
import com.sun.jersey.multipart.FormDataParam;
import com.yy.app.AModel;

@Entity(name = "__BlobInfo__")
public class Resource {
	@Id
	public String ID;

	public String content_type;

	public String filename;

	public Integer size;

	public Date creation;

	public String md5_hash;

	public String getUrl() {
		return "/media/show/" + ID + ".jpg";
	}

	public String getName() {
		return this.filename.substring(0, this.filename.indexOf('.'));
	}

	@Path("media")
	
	public static class View extends AModel.View {
		@GET
		@Produces(MediaType.TEXT_HTML)
		public Viewable indexUI() {
			return viewable(viewDataModel("Upload Resources", "media", "resources",
					Album.getAlbum(null).getResources(), "albums", Album.getAlbums()));
		}

		@GET
		@Path("want2upload/{resource}/{type}")
		@Produces(MediaType.TEXT_PLAIN)
		public String createUploadUrl(
				@PathParam("resource") String resource,
				@PathParam("type") String type,
				@Context UriInfo uri) {
			return BlobstoreServiceFactory.getBlobstoreService()
					.createUploadUrl(uri!=null ? 
							uri.getPath().substring("media/want2upload".length()) :
							"/"+resource+"/"+type);
		}
		
		@POST
		@Path("return")
		@Consumes(MediaType.MULTIPART_FORM_DATA)
		@Produces(MediaType.APPLICATION_JSON)
		public List<String> uploadedUrls(@Context HttpServletRequest request){
			List<String> urls=new ArrayList<String>();
			BlobstoreService service = BlobstoreServiceFactory.getBlobstoreService();
			Map<String, List<BlobKey>> uploads = service.getUploads(request);
			for (BlobKey key : uploads.get("file")) 
				urls.add("/media/show/" + key.getKeyString() + ".jpg");
			return urls;
		}
		
		@GET
		@Path("want2upload")
		@Produces(MediaType.TEXT_PLAIN)
		public String createUploadUrl() {
			return createUploadUrl(this.path(), "save",null);
		}

		@POST
		@Path("save")
		@Consumes(MediaType.MULTIPART_FORM_DATA)
		@Produces(MediaType.TEXT_HTML)
		public Viewable save(@FormDataParam("albumID") long albumID,
				@FormDataParam("albumName") String newAlbum,
				@Context HttpServletRequest request) {
			Objectify store = ObjectifyService.ofy();
			Album album = Album.getAlbum(albumID, newAlbum);

			BlobstoreService service = BlobstoreServiceFactory
					.getBlobstoreService();
			Map<String, List<BlobKey>> uploads = service.getUploads(request);
			if(uploads==null || uploads.isEmpty())
				return indexUI();
			List<Resource> resources = new ArrayList<Resource>();
			for (BlobKey key : uploads.get("file")) {
				Resource resource = store.load().type(Resource.class).id(key.getKeyString()).get();
				resources.add(resource);
				album.addResource(resource.ID);
			}
			

			store.save().entity(album).now();
			return viewable(viewDataModel("Uploaded Resources", "listmedia",
					"resources", resources, "template", "empty_template"));
		}

		@GET
		@Path("show/{key}.jpg")
		public String show(@PathParam("key") String key,
				@Context HttpServletResponse res) {
			try {
				BlobstoreServiceFactory.getBlobstoreService().serve(
						new BlobKey(key), res);
			} catch (IOException e) {

			}
			return "";
		}

		@GET
		@Path("album/{album}")
		@Produces(MediaType.TEXT_HTML)
		public Viewable showAlbum(@PathParam("album") long ID) {
			Objectify store = ObjectifyService.ofy();
			Album album = ID == 0 ? Album.getAlbum(null) : store.load().type(Album.class).id(ID).get();
			return viewable(viewDataModel("Album", "listalbummedia", "resources",
					album.getResources(), "template",
					"empty_template"));
		}
	}
}
