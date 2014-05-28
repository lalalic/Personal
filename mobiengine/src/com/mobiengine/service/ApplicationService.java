package com.mobiengine.service;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.util.ArrayList;
import java.util.Date;
import java.util.List;
import java.util.Map;

import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
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

import org.codehaus.jettison.json.JSONArray;
import org.codehaus.jettison.json.JSONException;
import org.codehaus.jettison.json.JSONObject;

import com.google.appengine.api.NamespaceManager;
import com.google.appengine.api.datastore.DatastoreServiceFactory;
import com.google.appengine.api.datastore.Entity;
import com.google.appengine.api.datastore.Key;
import com.google.appengine.api.datastore.KeyFactory;
import com.google.appengine.api.datastore.Query;
import com.google.appengine.api.datastore.Query.FilterOperator;
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
		if(user==null || !isManagement())
			throw new RuntimeException("Access Denied");
	}
	
	static boolean isManagement(){
		return TOP_NAMESPACE.equals(NamespaceManager.get());
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
			new Schema(NamespaceManager.get(),defaults);
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
		try{
			Entity appEntity=DatastoreServiceFactory.getDatastoreService().get(app);
			if(appEntity.hasProperty("clientCode")){
				FileService.delete((String)appEntity.getProperty("clientCode"));
			}
		}catch(Exception ex){
			ex.printStackTrace();
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
		if(user.getKey().getId()==(Long)this.app.getProperty("owner"))
			apps.add(this.app);
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
		
		new ApplicationService(){
			@Override 
			protected void initService(){
				this.schema=new Schema(){
					protected void retrieve(){}
				};
			}
			
			public void beforeCreate(Entity app,JSONObject request, JSONObject response){
				app.setProperty("name", MAIN_APP);
				app.setProperty("url", MAIN_APP);
			}
			
			@Override
			public void afterCreate(Entity app,JSONObject request, JSONObject response){
				super.afterCreate(app, request, response);
				TOP_NAMESPACE=app.getKey().getId()+"";
			}
			
		}.create(new JSONObject());
	}
	
	@Path(Service.VERSION+"/apps/upload")
	public static class AppUploader extends EntityService{
		public AppUploader(@HeaderParam("X-Session-Token") String sessionToken,
				@HeaderParam("X-Application-Id") String appId) {
			super(sessionToken,appId,KIND);
			if(user==null || TOP_NAMESPACE.equals(NamespaceManager.get()))
				throw new RuntimeException("Access Denied");
			if(user.getKey().getId()!=(Long)app.getProperty("author"))
				throw new RuntimeException("Access Denied");
		}
		
		@POST
		@Consumes(MediaType.MULTIPART_FORM_DATA)
		@Produces(MediaType.APPLICATION_JSON)
		public Response upload(@Context HttpServletRequest request,
				@FormDataParam("cloudCode") String cloudCode,
				@FormDataParam("schema") JSONArray schema,
				@FormDataParam("data") JSONObject data){
			try{
				String url=FileService.getUploadedURL(request);
				String oldVersion=(String)this.app.getProperty("clientCode");
				this.app.setUnindexedProperty("clientCode", url);
				if(cloudCode!=null)
					this.app.setUnindexedProperty("cloudCode", 
							SchemaService.TYPES.String.asEntityValue(cloudCode));
				else
					this.app.removeProperty("cloudCode");
				Date now=new Date();
				this.app.setProperty("modifiedDate", now);
				DatastoreServiceFactory.getDatastoreService().put(this.app);
				FileService.delete(oldVersion);
				
				if(schema!=null){
					SchemaService schemaService=new SchemaService(this.app,this.user);
					for(int i=0,len=schema.length();i<len;i++){
						JSONObject tableSchema = schema.getJSONObject(i);
						String tableName=tableSchema.getString("name");
						if(this.schema.types.containsKey(tableName)){
							schemaService.update(this.schema.getId(tableName), tableSchema);
						}else
							schemaService.create(tableSchema);
					}
				}
				/*
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
				return Response.ok(response).build();
			}catch(Exception ex){
				throw new RuntimeException(ex.getMessage());
			}
		}
	}

	
	
	@Path("my/{app}")
	public static class AppBootstrap{
		private static byte[] INDEX_DATA=null;
		@GET
		@Produces(MediaType.TEXT_HTML)
		public Response index(
				@Context HttpServletRequest request,
				@Context HttpServletResponse response) throws Exception{
			if(INDEX_DATA==null){
				synchronized(this){
					byte[] buffer=new byte[1024*100];
					int len;
					InputStream is=request.getSession().getServletContext()
						.getResourceAsStream("/yang/app.gz.html");
					ByteArrayOutputStream bos=new ByteArrayOutputStream(1024*100);
					while((len=is.read(buffer))!=-1)
						bos.write(buffer, 0, len);
					is.close();
					bos.close();
					INDEX_DATA=bos.toByteArray();
				}
			}
			return Response.ok(INDEX_DATA)
				.header("Vary", "Accept-Encoding")
				.header("Content-Encoding", "gzip")
				.build();
		}

		@GET
		@Path("bootstrap")
		public String bootstrap(@PathParam("app")String app,
				@Context HttpServletResponse response) throws IOException{
			String rawNS=NamespaceManager.get();
			try{
				NamespaceManager.set(TOP_NAMESPACE);
				@SuppressWarnings("deprecation")
				Entity appEntity=DatastoreServiceFactory.getDatastoreService()
					.prepare(new Query(KIND).addFilter("name", FilterOperator.EQUAL, app))
					.asSingleEntity();
				FileService.LoadService.serveDirect((String)appEntity.getProperty("clientCode"),response);
				response.getOutputStream().flush();
				return "";
			}finally{
				NamespaceManager.set(rawNS);
			}
		}
	}
}
