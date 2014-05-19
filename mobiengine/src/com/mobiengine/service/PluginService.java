package com.mobiengine.service;

import javax.ws.rs.HeaderParam;
import javax.ws.rs.Path;

import org.codehaus.jettison.json.JSONObject;

import com.google.appengine.api.datastore.DatastoreServiceFactory;
import com.google.appengine.api.datastore.Entity;
import com.google.appengine.api.datastore.Key;
import com.mobiengine.service.SchemaService.TYPES;

@Path(Service.VERSION+"/plugins")
public class PluginService extends EntityService {
	public final static String KIND="_plugin";
	public PluginService(@HeaderParam("X-Session-Token") String sessionToken,
			@HeaderParam("X-Application-Id") String appId) {
		super(sessionToken,appId,KIND);
	}
	
	public PluginService(Entity app, Entity user) {
		super(app,user, KIND);
	}

	static Entity makeSchema(){
		return SchemaService.makeSchema(KIND, 
				SchemaService.makeFieldSchema("name", TYPES.String, true, true),
				SchemaService.makeFieldSchema("title", TYPES.String, false, false),
				SchemaService.makeFieldSchema("description", TYPES.String, false, false),
				SchemaService.makeFieldSchema("icon", TYPES.String, false, false),
				SchemaService.makeFieldSchema("author", TYPES.Integer, true, false),
				SchemaService.makeFieldSchema("authorName", TYPES.String, false, false),
				SchemaService.makeFieldSchema("version", TYPES.String, false, false),
				SchemaService.makeFieldSchema("depends", TYPES.Array, false, false),
				SchemaService.makeFieldSchema("cloudCode", TYPES.String, false, false),
				SchemaService.makeFieldSchema("clientCode", TYPES.String, false, false));
	}

	@Override
	public void beforeUpdate(Entity entity, JSONObject request,
			JSONObject response) throws Exception {
		super.beforeUpdate(entity, request, response);
		if(request.has("clientCode") && 
				!request.getString("clientCode").equals(entity.getProperty("clientCode")))
			request.put("lastClientCode", entity.getProperty("clientCode"));
	}

	@Override
	public void afterUpdate(Entity entity, JSONObject request,
			JSONObject response) throws Exception {
		super.afterUpdate(entity, request, response);
		if(request.has("lastClientCode"))
			FileService.delete(request.getString("lastClientCode"));
	}

	@Override
	public void beforeDelete(Key key, JSONObject response) throws Exception {
		super.beforeDelete(key, response);
		Entity entity=DatastoreServiceFactory.getDatastoreService().get(key);
		if(entity.hasProperty("clientCode"))
			FileService.delete((String)entity.getProperty("clientCode"));
	}
	
	
}
