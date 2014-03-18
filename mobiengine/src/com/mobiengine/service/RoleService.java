package com.mobiengine.service;

import javax.servlet.http.HttpServletRequest;
import javax.ws.rs.HeaderParam;
import javax.ws.rs.Path;
import javax.ws.rs.core.Context;

import com.google.appengine.api.datastore.Entity;
import com.mobiengine.service.SchemaService.TYPES;

@Path(Service.VERSION+"/roles")
public class RoleService extends EntityService {
	public final static String KIND="_role";
	public RoleService(@Context HttpServletRequest request,@HeaderParam("X-Application-Id")String appId){
		super(request,appId, KIND);
	}
	
	public static Entity makeSchema(){
		return SchemaService.makeSchema(KIND,
				SchemaService.makeFieldSchema("name", TYPES.String, true, true),
				SchemaService.makeFieldSchema("roles",TYPES.Array, false, false),
				SchemaService.makeFieldSchema("users",TYPES.Array, false, false));
	}
}
