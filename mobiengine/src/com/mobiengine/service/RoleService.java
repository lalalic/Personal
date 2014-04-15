package com.mobiengine.service;

import javax.ws.rs.HeaderParam;
import javax.ws.rs.Path;

import com.google.appengine.api.datastore.Entity;
import com.mobiengine.service.SchemaService.TYPES;

@Path(Service.VERSION+"/roles")
public class RoleService extends EntityService {
	public final static String KIND="_role";
	public RoleService(@HeaderParam("X-Session-Token") String sessionToken,
			@HeaderParam("X-Application-Id") String appId) {
		super(sessionToken,appId,KIND);
	}
	
	public RoleService(Entity app, Entity user) {
		super(app,user, KIND);
	}

	public static Entity makeSchema(){
		return SchemaService.makeSchema(KIND,
				SchemaService.makeFieldSchema("name", TYPES.String, true, true),
				SchemaService.makeFieldSchema("roles",TYPES.Array, false, false),
				SchemaService.makeFieldSchema("users",TYPES.Array, false, false));
	}
}
