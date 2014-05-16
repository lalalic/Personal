package com.mobiengine.service;

import java.util.ArrayList;
import java.util.Date;
import java.util.List;
import java.util.Map;

import javax.servlet.http.HttpServletRequest;
import javax.ws.rs.Consumes;
import javax.ws.rs.DefaultValue;
import javax.ws.rs.GET;
import javax.ws.rs.HeaderParam;
import javax.ws.rs.POST;
import javax.ws.rs.Path;
import javax.ws.rs.PathParam;
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
import com.google.appengine.api.datastore.Text;
import com.mobiengine.service.SchemaService.Schema;
import com.mobiengine.service.SchemaService.TYPES;
import com.sun.jersey.multipart.FormDataParam;

@Path(Service.VERSION+"/apps")
public class ApplicationService extends EntityService {
	public static String TOP_NAMESPACE=null;
	private final static String MAIN_APP="www";
	final static String KIND="_app";
	final static String PLUGIN="_plugin";
	
	private ApplicationService(){
		super((String)null,null,KIND);
	}
	public ApplicationService(@HeaderParam("X-Session-Token") String sessionToken,
			@HeaderParam("X-Application-Id") String appId) {
		super(sessionToken,appId,KIND);
		if(user==null || !TOP_NAMESPACE.equals(NamespaceManager.get()))
			throw new RuntimeException("Access Denied");
	}
	
	@Override
	public void beforeCreate(Entity app, JSONObject request, JSONObject response){
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
	public void populate(Entity entity, JSONObject ob) throws Exception{
		
	}
	
	@Override 
	public void beforeUpdate(Entity app, JSONObject request, JSONObject response){
		try {
			if(user.getKey().getId()!=(Long)app.getProperty("author"))
				throw new RuntimeException("Access Denied");
			
			if(request.has("cloudCode"))
				app.setProperty("cloudCode", new Text(request.getString("cloudCode")));
			else{
				app.setProperty("name", request.getString("name"));
				app.setProperty("url", request.getString("url"));
			}
		} catch (JSONException e) {
			throw new RuntimeException(e.getMessage());
		}
	}
	
	@Override
	public void afterCreate(Entity app, JSONObject request, JSONObject response){
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
			
			defaults.add(entity=PluginService.makeSchema());
			entity.setProperty("createdAt", now);
			entity.setProperty("updatedAt", now);
			
			DatastoreServiceFactory.getDatastoreService().put(defaults);
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
	
	@POST
	@Path("upload")
	@Consumes(MediaType.MULTIPART_FORM_DATA)
	@Produces(MediaType.APPLICATION_JSON)
	public Response upload(@Context HttpServletRequest request,
			@FormDataParam("cloudCode") String cloudCode,
			@FormDataParam("schema") JSONObject schema,
			@FormDataParam("data") JSONObject data){
		if(user.getKey().getId()!=(Long)app.getProperty("author"))
			throw new RuntimeException("Access Denied");
		try{
			String url=FileService.getUploadedURL(request);
			this.app.setUnindexedProperty("clientCode", url);
			if(cloudCode!=null)
				this.app.setUnindexedProperty("cloudCode", SchemaService.TYPES.String.asEntityValue(cloudCode));
			else
				this.app.removeProperty("cloudCode");
			Date now=new Date();
			this.app.setProperty("modifiedDate", now);
			DatastoreServiceFactory.getDatastoreService().put(this.app);
			
			/*
			if(schema!=null){
				SchemaService schemaService=new SchemaService(this.app,this.user);
				Iterator<String> it=schema.keys();
				while(it.hasNext()){
					String tableName=it.next();
					JSONObject newSchema=new JSONObject();
					JSONObject tableSchema = schema.getJSONObject(tableName);
					Iterator<String> it1=tableSchema.keys();
					JSONArray fields=new JSONArray();
					while(it1.hasNext())
						fields.put(tableSchema.getJSONObject(it1.next()));
					newSchema.put("name", tableName);
					newSchema.put("fields", fields);
					schemaService.create(newSchema);
				}
			}
			
			if(data!=null){
				EntityService entityService=new EntityService(this.app,this.user, null);
				Iterator<String> it=data.keys();
				while(it.hasNext()){
					JSONArray records=data.getJSONArray(it.next());
					if(records!=null && records.length()>0){
						entityService.kind=it.next();
						for(int i=0, len=records.length();i<len;i++)
							entityService.create(records.getJSONObject(i));
					}
				}
			}
			*/
			JSONObject response=new JSONObject();
			response.put("clientCode", url);
			response.put("modifiedDate", now);
			return Response.ok(this.app).build();
		}catch(Exception ex){
			throw new RuntimeException(ex.getMessage());
		}
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
	
	static Entity makeSchema(){
		return SchemaService.makeSchema(KIND,
				SchemaService.makeFieldSchema("name", TYPES.String, true, false),
				SchemaService.makeFieldSchema("url", TYPES.String, true, true),
				SchemaService.makeFieldSchema("author", TYPES.Integer, true, false),
				SchemaService.makeFieldSchema("authorName", TYPES.String, false, false),
				SchemaService.makeFieldSchema("cloudCode", TYPES.String, false, false),
				SchemaService.makeFieldSchema("clientCode", TYPES.String, false, false));
	}
	
	// initialize the whole system
	public static void initSystem(){
		NamespaceManager.set(null);
		Entity www=DatastoreServiceFactory.getDatastoreService()
			.prepare(new Query(KIND))
			.asSingleEntity();
		if(www!=null){
			TOP_NAMESPACE=www.getKey().getId()+"";
			return;
		}
		
		try {
			ApplicationService service=new ApplicationService(){
				@Override 
				protected void initService(){
					this.schema=new Schema(){
						protected void retrieve(){}
					};
				}
				
				public void beforeCreate(Entity app,JSONObject request, JSONObject response){}
				
				@Override
				public void afterCreate(Entity app,JSONObject request, JSONObject response){
					super.afterCreate(app, request, response);
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
	
	@Path("my")
	public static class AppLoader{
		@GET
		@Path("{name:.*}")
		public Response get(@PathParam("name")String name){
			
			return null;
		}
	}
}
