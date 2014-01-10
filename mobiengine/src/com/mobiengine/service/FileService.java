package com.mobiengine.service;

import javax.servlet.http.HttpServletRequest;
import javax.ws.rs.HeaderParam;
import javax.ws.rs.Path;
import javax.ws.rs.core.Context;

@Path(EntityService.VERSION+"/files")
public class FileService extends EntityService {
	private final static String KIND="_file";
	public FileService(@Context HttpServletRequest request,@HeaderParam("X-Application-Id")String appId){
		super(request,appId, KIND);
	}

}
