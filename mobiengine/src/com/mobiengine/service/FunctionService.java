package com.mobiengine.service;

import javax.ws.rs.Consumes;
import javax.ws.rs.HeaderParam;
import javax.ws.rs.POST;
import javax.ws.rs.Path;
import javax.ws.rs.PathParam;
import javax.ws.rs.Produces;
import javax.ws.rs.core.MediaType;
import javax.ws.rs.core.Response;

import org.codehaus.jettison.json.JSONObject;

import com.google.appengine.api.datastore.Entity;

@Path(Service.VERSION+"/functions")
public class FunctionService extends Service {
	public final static String KIND="_function";
	public FunctionService(@HeaderParam("X-Session-Token")String sessionToken, 
			@HeaderParam("X-Application-Id")String appId) {
		super(sessionToken, appId, KIND);
	}

	public FunctionService(Entity app, Entity user) {
		super(app,user,KIND);
	}

	@POST
	@Path("{path:.*}")
	@Consumes(MediaType.TEXT_PLAIN)
	@Produces(MediaType.APPLICATION_JSON)
	public Response service(@PathParam("path") String path, String params){
		return Response.ok().entity(getCloud().callFunction(path, params)).build();
	}

	/**
	 * for cloud ajax
	 * @param data
	 * @param path
	 * @return
	 */
	public Response service(String path, JSONObject params) throws Exception{
		return Response.ok().entity(getCloud().callFunction(path, params)).build();
	}
}
