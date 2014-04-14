package com.mobiengine.service;

import java.util.ArrayList;
import java.util.Date;
import java.util.List;
import java.util.Map;

import javax.ws.rs.DefaultValue;
import javax.ws.rs.GET;
import javax.ws.rs.HeaderParam;
import javax.ws.rs.Path;
import javax.ws.rs.Produces;
import javax.ws.rs.QueryParam;
import javax.ws.rs.core.MediaType;
import javax.ws.rs.core.Response;

import org.codehaus.jettison.json.JSONException;
import org.codehaus.jettison.json.JSONObject;

import com.google.appengine.api.NamespaceManager;
import com.google.appengine.api.datastore.DatastoreServiceFactory;
import com.google.appengine.api.datastore.Entity;
import com.google.appengine.api.datastore.Key;
import com.google.appengine.api.datastore.KeyFactory;
import com.google.appengine.api.datastore.Query;
import com.mobiengine.service.SchemaService.Schema;
import com.mobiengine.service.SchemaService.TYPES;

@Path(Service.VERSION+"/apps")
public class ApplicationService extends EntityService {
	public static String TOP_NAMESPACE=null;
	private final static String MAIN_APP="www";
	final static String KIND="_app";
	
	public ApplicationService(@HeaderParam("X-Session-Token") String sessionToken,
			@HeaderParam("X-Application-Id") String appId) {
		super(sessionToken,appId,KIND);
		if(user==null || !TOP_NAMESPACE.equals(NamespaceManager.get()))
			throw new RuntimeException("Access Denied");
	}
	
	@Override
	public void beforeCreate(Entity app, JSONObject request){
		app.setProperty("author", user.getKey().getId());
		app.setUnindexedProperty("authorName", user.getProperty("username"));
		try {
			app.setProperty("name", request.getString("name"));
			app.setProperty("url", request.getString("url"));
		} catch (JSONException e) {
			throw new RuntimeException(e.getMessage());
		}
	}
	
	@Override 
	public void beforeUpdate(Entity app, JSONObject request){
		try {
			if(user.getKey().getId()!=(Long)app.getProperty("author"))
				throw new RuntimeException("Access Denied");
			
			if(request.has("name")){
				app.setProperty("name", request.getString("name"));
				app.setProperty("url", request.getString("url"));
			}else
				app.setProperty("cloudCode", request.getString("cloudCode"));
		} catch (JSONException e) {
			throw new RuntimeException(e.getMessage());
		}
	}
	
	@Override
	public void afterCreate(Entity app,JSONObject response){
		try{
			NamespaceManager.set(app.getKey().getId()+"");
			List<Entity> defaults=new ArrayList<Entity>();
			Date now = new Date();
			Entity entity=null;
			defaults.add(entity=UserService.makeSchema());
			entity.setProperty("createdAt", now);
			entity.setProperty("updatedAt", now);
			
			defaults.add(entity=RoleService.makeSchema());
			entity.setProperty("createdAt", now);
			entity.setProperty("updatedAt", now);
			
			DatastoreServiceFactory.getAsyncDatastoreService().put(defaults);
			response.put("apiKey", getApiKey(app));
		}catch(Exception ex){
			throw new RuntimeException(ex.getMessage());
		}finally{
			NamespaceManager.set(TOP_NAMESPACE);	
		}
	}
	
	private String getApiKey(Entity app){
		return  KeyFactory.keyToString(app.getKey());
	}
	
	public void afterUpdate(Entity app){
		//compile cloud code
	}
	
	public void beforeDelete(Key app){
		//1. remove all data
		
		//2. remove app
	}
	
	@GET
	@Produces(MediaType.APPLICATION_JSON)
	public Response get(@QueryParam("where") JSONObject ob, 
			@QueryParam("order") String order, 
			@QueryParam("limit") @DefaultValue("-1") int limit, 
			@QueryParam("skip") @DefaultValue("0") int skip,
			@QueryParam("keys") String keys,
			@QueryParam("count") boolean count){
		if(ob==null)
			ob=new JSONObject();
		try {
			ob.put("author", user.getKey().getId());
		} catch (JSONException ex) {
			throw new RuntimeException(ex.getMessage());
		}
		Response r=super.get(ob, order, limit, skip, keys, count);
		@SuppressWarnings("unchecked")
		List<Entity> apps=(List<Entity>)((Map<String,Object>)r.getEntity()).get("results");
		for(Entity app : apps)
			app.setProperty("apiKey", getApiKey(app));
		return r;
	}
	
	public static Entity makeSchema(){
		return SchemaService.makeSchema(KIND,
				SchemaService.makeFieldSchema("name", TYPES.String, true, false),
				SchemaService.makeFieldSchema("url", TYPES.String, true, true),
				SchemaService.makeFieldSchema("author", TYPES.Integer, true, false),
				SchemaService.makeFieldSchema("authorName", TYPES.String, false, false),
				SchemaService.makeFieldSchema("cloudCode", TYPES.File, false, false));
	}

	// initialize the whole system
	static void initSystem(){
		NamespaceManager.set(null);
		Entity www=DatastoreServiceFactory.getDatastoreService()
			.prepare(new Query(KIND))
			.asSingleEntity();
		if(www!=null){
			TOP_NAMESPACE=www.getKey().getId()+"";
			return;
		}
		
		try {
			ApplicationService service=new ApplicationService(null,null){
				@Override 
				protected void initService(){
					this.schema=new Schema(){
						protected void retrieve(){}
					};
				}
				
				@Override
				public void afterCreate(Entity app,JSONObject response){
					super.afterCreate(app, response);
					TOP_NAMESPACE=app.getKey().getId()+"";
				}
				
			};
			JSONObject ob=new JSONObject();
			ob.put("name", MAIN_APP);
			ob.put("url", MAIN_APP);
			service.create(ob);
		} catch (JSONException e) {
			
		}
	}
}
