package com.mobiengine.service;

import java.util.ArrayList;
import java.util.List;
import java.util.TreeMap;

import javax.servlet.http.HttpServletRequest;
import javax.ws.rs.GET;
import javax.ws.rs.HeaderParam;
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
import com.google.appengine.api.datastore.EmbeddedEntity;
import com.google.appengine.api.datastore.Entity;
import com.google.appengine.api.datastore.Key;
import com.google.appengine.api.datastore.KeyFactory;
import com.mobiengine.service.SchemaService.Schema;
import com.mobiengine.service.SchemaService.TYPES;

@Path(EntityService.VERSION+"/apps")
public class ApplicationService extends EntityService {
	private final static String MAIN_APP="www";
	private final static String KIND="_app";
	
	public ApplicationService(@Context HttpServletRequest request,@HeaderParam("X-Application-Id")String appId){
		super(request,appId, KIND);
	}
	
	@Override
	public void beforeCreate(Entity app, JSONObject request){
		if(this.userId!=0){
			app.setProperty("author", this.userId);
			app.setUnindexedProperty("authorName", this.userName);
		}
	}
	
	@Override
	public void afterCreate(Entity app,JSONObject response){
		String _namespace=NamespaceManager.get();
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
			NamespaceManager.set(_namespace);	
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
				SchemaService.makeFieldSchema("authorName", TYPES.String, false, false));
	}
	
	@Path(EntityService.VERSION+"/init")
	public static class InitOnce{
		@GET
		public Response initSystem(){
			try {
				ApplicationService service=new ApplicationService(null,null){
					@Override 
					protected void initService(){
						this.schema=new Schema(){
							@SuppressWarnings("unchecked")
							protected void retrieve(){
								Entity schema=makeSchema();
								TreeMap<String,EmbeddedEntity> fields=new TreeMap<String,EmbeddedEntity>();
								for(EmbeddedEntity field: (List<EmbeddedEntity>)schema.getProperty("fields"))
									fields.put(field.getProperty("name").toString(), field);
								this.types.put("_app",fields);
							}
						};
					}
					
					@Override 
					protected void makeDefaultSchema(List<Entity> schemas){
						schemas.add(makeSchema());
					}
					
					@Override
					protected String getUrlRoot(){
						return "";
					}
					
				};
				JSONObject ob=new JSONObject();
				ob.put("name", MAIN_APP);
				ob.put("url", "www");
				return service.create(ob);
			} catch (JSONException e) {
				return Response.serverError()
					.entity(e).build();
			}
		}
	}
}
