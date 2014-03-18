package com.mobiengine.service;

import java.util.ArrayList;
import java.util.Date;
import java.util.HashMap;
import java.util.Iterator;
import java.util.List;
import java.util.Map;
import java.util.TreeMap;

import javax.servlet.http.HttpServletRequest;
import javax.ws.rs.Consumes;
import javax.ws.rs.HeaderParam;
import javax.ws.rs.POST;
import javax.ws.rs.Path;
import javax.ws.rs.PathParam;
import javax.ws.rs.Produces;
import javax.ws.rs.core.Context;
import javax.ws.rs.core.MediaType;
import javax.ws.rs.core.Response;

import org.codehaus.jettison.json.JSONArray;
import org.codehaus.jettison.json.JSONObject;
import org.codehaus.jettison.json.JSONString;

import com.google.appengine.api.datastore.DatastoreServiceFactory;
import com.google.appengine.api.datastore.EmbeddedEntity;
import com.google.appengine.api.datastore.Entity;
import com.google.appengine.api.datastore.FetchOptions;
import com.google.appengine.api.datastore.Key;
import com.google.appengine.api.datastore.KeyFactory;
import com.google.appengine.api.datastore.PreparedQuery;
import com.google.appengine.api.datastore.Query;
import com.google.appengine.api.datastore.Query.FilterOperator;
import com.google.appengine.api.datastore.Query.SortDirection;

@Path(Service.VERSION+"/schemas")
public class SchemaService extends EntityService{
	private static final String KIND="_schema";
	private static final Map<String, Schema> schemas=new HashMap<String,Schema>();
	
	public static Entity makeSchema(String kind,EmbeddedEntity ... fieldSchemas){
		Entity schema=new Entity(KIND);
		schema.setUnindexedProperty("name", kind);
		List<EmbeddedEntity> fields=new ArrayList<EmbeddedEntity>();
		schema.setUnindexedProperty("fields", fields);
		fields.add(SchemaService.makeFieldSchema("id",TYPES.Integer, true, true));
		for(EmbeddedEntity fieldSchema : fieldSchemas)
			fields.add(fieldSchema);
		fields.add(SchemaService.makeFieldSchema("createdAt", TYPES.Date, true, false));
		fields.add(SchemaService.makeFieldSchema("updatedAt", TYPES.Date, true, false));
		fields.add(SchemaService.makeFieldSchema("ACL", TYPES.Object, false, false));
		return schema;
	}
	
	public static Entity addField(Entity schema, EmbeddedEntity ... fieldSchemas){
		@SuppressWarnings("unchecked")
		List<EmbeddedEntity> fields=(List<EmbeddedEntity>)schema.getProperty("fields");
		int index=fields.size()-3;
		for(EmbeddedEntity fieldSchema : fieldSchemas)
			fields.add(index++,fieldSchema);
		return schema;
	}
	
	public static EmbeddedEntity makeFieldSchema(String name, TYPES type, boolean searchable, boolean unique){
		EmbeddedEntity field=new EmbeddedEntity();
		field.setProperty("name", name);
		if(type==null)
			type=TYPES.String;
		field.setUnindexedProperty("type", type.toString());
		if(searchable)
			field.setUnindexedProperty("searchable", searchable);
		if(unique)
			field.setUnindexedProperty("unique", unique);
		return field;
	}
	
	public SchemaService(@Context HttpServletRequest request,@HeaderParam("X-Application-Id")String appId){
		super(request,appId, KIND);
	}
	
	@POST
	@Consumes(MediaType.APPLICATION_JSON)
	@Produces(MediaType.APPLICATION_JSON)
	@Override
	public Response create(JSONObject ob) {
		try {
			Entity entity = new Entity(kind);
			Date now = new Date();
			entity.setProperty("createdAt", now);
			entity.setProperty("updatedAt", now);
			entity.setUnindexedProperty("name", ob.getString("name"));
			entity.setUnindexedProperty("fields", makeSchema("a").getProperty("fields"));
			DatastoreServiceFactory.getDatastoreService().put(entity);
			return Response
					.ok()
					.header("Location",	this.getUrlRoot() +"/"+ entity.getKey().getId())
					.entity(entity).build();
		} catch (Exception ex) {
			return Response.serverError().entity(ex).build();
		}
	}
	
	@Override 
	public Response update(long id, JSONObject ob){
		return Response.serverError().entity(new RuntimeException("Not Support")).build();
	}
	
	@POST
	@Path("{id:.*}/column")
	@Consumes(MediaType.APPLICATION_JSON)
	@Produces(MediaType.APPLICATION_JSON)
	public Response createColumn(@PathParam("id") long id, JSONObject ob) {
		try {
			Key key = KeyFactory.createKey(kind, id);
			Entity entity = DatastoreServiceFactory.getDatastoreService().get(
					key);
			if (entity == null)
				throw new Exception("Entity Not Exist");
			Date now = new Date();
			entity.setProperty("updatedAt", now);
			addField(entity, makeFieldSchema(
					ob.getString("name"), 
					ob.has("type") ? TYPES.valueOf(ob.getString("type")) : TYPES.String,
					ob.has("searchable"),
					ob.has("unique")));
			DatastoreServiceFactory.getAsyncDatastoreService().put(entity);
			JSONObject changed = new JSONObject();
			changed.put("updatedAt", now);
			return Response.ok().entity(changed).build();
		} catch (Exception ex) {
			return Response.serverError().entity(ex).build();
		}
	}
	
	@Override
	public void beforeDelete(Key entity) {
		if(UserService.KIND.equals(entity.getKind())
				|| RoleService.KIND.equals(entity.getKind()))
			throw new RuntimeException("Not Supported");
	}
	
	@Override
	public void afterDelete(Key entity){
		//how to drop a table
	}
	
	enum TYPES{String, Integer, Float, Boolean, Date, File, GeoPoint, Array, Object, Pointer}
	public static class Schema{
		protected TreeMap<String,TreeMap<String, EmbeddedEntity>> types=new TreeMap<String,TreeMap<String, EmbeddedEntity>>();
		Schema(){
			retrieve();
		}
		
		@SuppressWarnings("unchecked")
		protected void retrieve(){
			Query query=new Query(KIND);
			List<Entity> kinds=DatastoreServiceFactory.getDatastoreService()
				.prepare(query)
				.asList(FetchOptions.Builder.withDefaults());
			
			for(Entity kind : kinds){
				String name=kind.getProperty("name").toString();
				TreeMap<String,EmbeddedEntity> fields=new TreeMap<String,EmbeddedEntity>();
				for(EmbeddedEntity field: (List<EmbeddedEntity>)kind.getProperty("fields"))
					fields.put(field.getProperty("name").toString(), field);
				types.put(name, fields);
			}
			if(types.isEmpty())
				throw new RuntimeException("Applicaiton doesn't exist");
		}
		
		@SuppressWarnings("deprecation")
		protected int exists(String kind, String field, Object value) {
			try {
				Query query = new Query(kind);
				query.addFilter(field, FilterOperator.EQUAL, value);
				query.setKeysOnly();
				PreparedQuery pq = DatastoreServiceFactory.getDatastoreService()
						.prepare(query);
				return pq.countEntities(FetchOptions.Builder.withLimit(2));
			} catch (Exception e) {
				throw new RuntimeException(e.getMessage());
			}
		}
		
		public void populate(Entity entity, JSONObject ob) throws Exception{
			String kind=entity.getKind();
			if(KIND.equals(kind) || ApplicationService.KIND.equals(kind))//_schema kind is for internal only
				return;
			TreeMap<String, EmbeddedEntity> fields=types.get(kind);
			if(fields==null)
				throw new RuntimeException(kind+" is not defined as a type");
			boolean isNew=entity.getKey().getId()==0;
			for(String key: fields.keySet()){
				Object value=null;
				EmbeddedEntity schema=fields.get(key);
				if(!ob.has(key) || (value=ob.get(key))==null || value.toString().length()==0){
					if(entity.hasProperty(key) && !("createdAt".equals(key) || "updatedAt".equals(key)))
						entity.removeProperty(key);
					continue;
				}
				
				if(schema.hasProperty("unique")){
					int count=exists(kind,key,value);
					if((isNew && count>0) || (!isNew && count>1))
						throw new RuntimeException(value+" already exits in "+kind);
				}
				if(schema.hasProperty("unindex"))
					entity.setUnindexedProperty(key, value);
				else
					entity.setProperty(key, value);
			}
		}
		
		@SuppressWarnings({ "rawtypes", "deprecation" })
		public void populate(Query query, JSONObject ob) throws Exception{
			Iterator it=ob.keys();
			while(it.hasNext()){
				String name=it.next().toString();
				Object value=ob.get(name);
				if(value instanceof JSONObject){
					Iterator it1=((JSONObject)value).keys();
					while(it1.hasNext()){
						String op=it1.next().toString();
						query.addFilter(name, FilterOperator.valueOf(op), ((JSONObject)value).get(op));
					}
				}else if(value instanceof JSONString){
					query.addFilter(name, FilterOperator.EQUAL, value.toString());
				}else if(value instanceof JSONArray){
					query.addFilter(name, FilterOperator.IN, toArray((JSONArray)value));
				}else if("_orderBy".equalsIgnoreCase(name)){
					String field=value.toString();
					if(field.startsWith("-"))
						query.addSort(field.substring(1),SortDirection.DESCENDING);
					else
						query.addSort(field, SortDirection.ASCENDING);
				}else
					query.addFilter(name, FilterOperator.EQUAL, value);
			}
		}
		
		private Object[] toArray(JSONArray ob) throws Exception{
			Object[] data = new Object[ob.length()];
			for(int i=0,len=data.length; i<len; i++)
				data[i]=ob.get(i);
			return data;
		}
		
		public static synchronized Schema get(String appKey){
			if(!schemas.containsKey(appKey)){
				schemas.put(appKey, new Schema());
			}
			return schemas.get(appKey);
		}
	}	
}
