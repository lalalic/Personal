package com.mobiengine.service;

import javax.ws.rs.HeaderParam;
import javax.ws.rs.Path;

@Path(Service.VERSION+"/files")
public class FileService extends EntityService {
	private final static String KIND="_file";
	public FileService(@HeaderParam("X-Session-Token") String sessionToken,
			@HeaderParam("X-Application-Id") String appId) {
		super(sessionToken,appId,KIND);
	}

}
