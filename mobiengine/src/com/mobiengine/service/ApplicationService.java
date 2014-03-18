package com.mobiengine.service;

import java.util.ArrayList;
import java.util.List;

import javax.servlet.http.HttpServletRequest;
import javax.ws.rs.Consumes;
import javax.ws.rs.FormParam;
import javax.ws.rs.GET;
import javax.ws.rs.HeaderParam;
import javax.ws.rs.POST;
import javax.ws.rs.Path;
import javax.ws.rs.Produces;
import javax.ws.rs.QueryParam;
import javax.ws.rs.core.Context;
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
	private static String TOP_NAMESPACE=null;
	private final static String MAIN_APP="www";
	final static String KIND="_app";
	
	public ApplicationService(@Context HttpServletRequest request,@HeaderParam("X-Application-Id")String appId){
		super(request,appId, KIND);
	}
	
	@Override
	protected void initService(){
		super.initService();
		NamespaceManager.set(TOP_NAMESPACE);
	}
	
	@POST
	@Path("/cloudcode")
	@Consumes(MediaType.APPLICATION_FORM_URLENCODED)
	@Produces(MediaType.APPLICATION_JSON)
	public Response cloudCode(@FormParam(value = "cloudcode")String cloudCode){
		Entity app=this.getApp();
		app.setProperty("cloudCode", cloudCode);
		DatastoreServiceFactory.getAsyncDatastoreService().put(app);
		return Response.ok().build();
	}
	
	@Override
	public void beforeCreate(Entity app, JSONObject request){
		app.setProperty("author", this.userId);
		app.setUnindexedProperty("authorName", this.userName);
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
			app.setProperty("name", request.getString("name"));
			app.setProperty("url", request.getString("url"));
		} catch (JSONException e) {
			throw new RuntimeException(e.getMessage());
		}
	}
	
	@Override
	public void afterCreate(Entity app,JSONObject response){
		try{
			NamespaceManager.set(app.getKey().getId()+"");
			List<Entity> defaults=new ArrayList<Entity>(); 
			defaults.add(UserService.makeSchema());
			defaults.add(RoleService.makeSchema());
			makeDefaultSchema(defaults);
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
	
	protected void makeDefaultSchema(List<Entity> schemas){
		
	}
	
	@GET
	@Produces(MediaType.APPLICATION_JSON)
	public Response get(@QueryParam("where") JSONObject ob) {
		if(ob==null)
			ob=new JSONObject();
		try {
			ob.put("author", this.userId);
		} catch (JSONException ex) {
			throw new RuntimeException(ex.getMessage());
		}
		Response r=super.get(ob);
		@SuppressWarnings("unchecked")
		List<Entity> apps=(List<Entity>)r.getEntity();
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
