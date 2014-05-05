package com.mobiengine.service;

import java.io.IOException;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import javax.ws.rs.Consumes;
import javax.ws.rs.GET;
import javax.ws.rs.HeaderParam;
import javax.ws.rs.POST;
import javax.ws.rs.Path;
import javax.ws.rs.PathParam;
import javax.ws.rs.Produces;
import javax.ws.rs.core.Context;
import javax.ws.rs.core.MediaType;
import javax.ws.rs.core.Response;
import javax.ws.rs.core.UriInfo;

import com.google.appengine.api.appidentity.AppIdentityServiceFactory;
import com.google.appengine.api.blobstore.BlobKey;
import com.google.appengine.api.blobstore.BlobstoreService;
import com.google.appengine.api.blobstore.BlobstoreServiceFactory;
import com.google.appengine.api.blobstore.FileInfo;
import com.google.appengine.api.blobstore.UploadOptions;

@Path(Service.VERSION+"/files")
public class FileService extends EntityService {
	private final static String KIND="_file";
	private final static String BUCKET=AppIdentityServiceFactory.getAppIdentityService().getDefaultGcsBucketName();
	private final static UploadOptions option=UploadOptions.Builder.withGoogleStorageBucketName(BUCKET).maxUploadSizeBytesPerBlob(1024*1024*5);
	public FileService(@HeaderParam("X-Session-Token") String sessionToken,
			@HeaderParam("X-Application-Id") String appId) {
		super(sessionToken,appId,KIND);
	}
	
	@GET
	@Path("want2upload")
	@Produces(MediaType.TEXT_PLAIN)
	public String createUploadUrl(@Context UriInfo uri) {
		return BlobstoreServiceFactory.getBlobstoreService()
				.createUploadUrl("/"+uri.getPath()+"DirectReturn", option);
	}
	
	@POST
	@Path("want2uploadDirectReturn")
	@Consumes(MediaType.MULTIPART_FORM_DATA)
	@Produces(MediaType.APPLICATION_JSON)
	public Response uploadedUrls(@Context HttpServletRequest request,@Context UriInfo uri){
		List<String> urls=new ArrayList<String>();
		BlobstoreService service = BlobstoreServiceFactory.getBlobstoreService();
		Map<String, List<FileInfo>> uploads = service.getFileInfos(request);
		for (FileInfo file : uploads.get("file")) 
			urls.add("/files/show/"+service.createGsBlobKey("/gs/" + BUCKET + "/" + file.getGsObjectName())+".jpg");
		return Response.ok(urls.get(0)).build();
	}
	
	@GET
	@Path("show/{key}.jpg")
	@Produces("image/*")
	public String show(@PathParam("key") String key,
			@Context HttpServletResponse res) {
		try {
			BlobstoreServiceFactory.getBlobstoreService().serve(
					new BlobKey(key), res);
		} catch (IOException e) {

		}
		return "";
	}
}
