package com.mobiengine.service;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import javax.ws.rs.Consumes;
import javax.ws.rs.DefaultValue;
import javax.ws.rs.GET;
import javax.ws.rs.HeaderParam;
import javax.ws.rs.POST;
import javax.ws.rs.Path;
import javax.ws.rs.PathParam;
import javax.ws.rs.Produces;
import javax.ws.rs.QueryParam;
import javax.ws.rs.core.Context;
import javax.ws.rs.core.MediaType;
import javax.ws.rs.core.Response;
import javax.ws.rs.core.UriBuilder;

import com.google.appengine.api.appidentity.AppIdentityServiceFactory;
import com.google.appengine.api.blobstore.BlobInfo;
import com.google.appengine.api.blobstore.BlobKey;
import com.google.appengine.api.blobstore.BlobstoreService;
import com.google.appengine.api.blobstore.BlobstoreServiceFactory;
import com.google.appengine.api.blobstore.UploadOptions;
import com.google.appengine.api.datastore.DatastoreServiceFactory;
import com.google.appengine.api.datastore.Entity;
import com.google.appengine.api.datastore.KeyFactory;
import com.sun.jersey.spi.resource.Singleton;

@Path(Service.VERSION+"/files")
public class FileService extends EntityService {
	private final static String KIND="__BlobInfo__";
	private final static String BUCKET=AppIdentityServiceFactory.getAppIdentityService().getDefaultGcsBucketName();
	private final static UploadOptions option=UploadOptions.Builder.withMaxUploadSizeBytes(1024*1024*5).googleStorageBucketName(BUCKET);
	public FileService(@HeaderParam("X-Session-Token") String sessionToken,
			@HeaderParam("X-Application-Id") String appId) {
		super(sessionToken,appId,KIND);
	}
	
	@GET
	@Path("want2upload")
	@Produces(MediaType.TEXT_PLAIN)
	public String createUploadUrl(@QueryParam("callback") @DefaultValue("/"+Service.VERSION+"/files/directReturn") String callback) {
		return BlobstoreServiceFactory.getBlobstoreService()
				.createUploadUrl(callback.replaceAll("//", "/"), option);
	}
	
	@POST
	@Path("directReturn")
	@Consumes(MediaType.MULTIPART_FORM_DATA)
	@Produces(MediaType.APPLICATION_JSON)
	public Response uploadedUrls(@Context HttpServletRequest request){
		return Response.ok(getUploadedURL(request)).build();
	}
	
	public static String getUploadedURL(HttpServletRequest request){
		List<String> urls=new ArrayList<String>();
		BlobstoreService service = BlobstoreServiceFactory.getBlobstoreService();
		Map<String, List<BlobInfo>> uploads = service.getBlobInfos(request);
		for (BlobInfo file : uploads.get("file"))
			urls.add("/"+LoadService.PATH.build(file.getBlobKey().getKeyString()).toASCIIString());			
		return urls.get(0);
	}
	
	public static Entity get(String pathOrKey) throws Exception{
		String key=pathOrKey.replaceFirst("/"+Service.VERSION+"file/", "");
		return DatastoreServiceFactory.getDatastoreService().get(KeyFactory.createKey(KIND, key));
	}
	
	public static void delete(String pathOrKey){
		try {
			String key=pathOrKey.replaceFirst("/"+Service.VERSION+"file/", "");
			BlobstoreServiceFactory.getBlobstoreService().delete(new BlobKey(key));
		} catch (Exception e) {
			e.printStackTrace();
		}
	}

	
	@Path(Service.VERSION+"/file")
	@Singleton
	public static class LoadService{
		static UriBuilder PATH=UriBuilder.fromResource(LoadService.class).path(LoadService.class, "get");
		@GET
		@Path("{key}")
		public String get(@PathParam("key") String key,
				@Context HttpServletResponse res) {
			try {
				Entity blob=FileService.get(key);
				res.setContentType((String)blob.getProperty("content_type"));
				BlobstoreServiceFactory.getBlobstoreService().serve(new BlobKey(key), res);
			} catch (Exception e) {
				e.printStackTrace();
				throw new RuntimeException(e);
			}
			return "";
		}
	}
}
