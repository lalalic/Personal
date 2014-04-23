package com.mobiengine.service;

import javax.ws.rs.GET;
import javax.ws.rs.HeaderParam;
import javax.ws.rs.Path;
import javax.ws.rs.PathParam;
import javax.ws.rs.Produces;
import javax.ws.rs.core.Context;
import javax.ws.rs.core.MediaType;
import javax.ws.rs.core.UriInfo;

import com.google.appengine.api.blobstore.BlobstoreServiceFactory;

@Path(Service.VERSION+"/files")
public class FileService extends EntityService {
	private final static String KIND="_file";
	public FileService(@HeaderParam("X-Session-Token") String sessionToken,
			@HeaderParam("X-Application-Id") String appId) {
		super(sessionToken,appId,KIND);
	}
	
	@GET
	@Path("want2upload")
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

}
