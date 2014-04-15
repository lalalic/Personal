package com.mobiengine.service;

import java.util.ArrayList;
import java.util.Date;
import java.util.HashMap;
import java.util.Iterator;
import java.util.List;
import java.util.Map;
import java.util.TreeMap;

import javax.ws.rs.Consumes;
import javax.ws.rs.HeaderParam;
import javax.ws.rs.POST;
import javax.ws.rs.PUT;
import javax.ws.rs.Path;
import javax.ws.rs.PathParam;
import javax.ws.rs.Produces;
import javax.ws.rs.core.MediaType;
import javax.ws.rs.core.Response;

import org.codehaus.jettison.json.JSONArray;
import org.codehaus.jettison.json.JSONObject;

import com.google.appengine.api.datastore.DatastoreServiceFactory;
import com.google.appengine.api.datastore.EmbeddedEntity;
import com.google.appengine.api.datastore.Entity;
import com.google.appengine.api.datastore.EntityNotFoundException;
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
	
	public SchemaService(@HeaderParam("X-Session-Token") String sessionToken,
			@HeaderParam("X-Application-Id") String appId) {
		super(sessionToken,appId,KIND);
	}
	
	public SchemaService(Entity app, Entity user) {
		super(app,user,KIND);
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
			schemas.put(this.appId, new Schema());
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
	
	@PUT
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
					ob.has("searchable") && ob.getBoolean("searchable"),
					ob.has("unique") && ob.getBoolean("unique")));
			DatastoreServiceFactory.getAsyncDatastoreService().put(entity);
			schemas.put(this.appId, new Schema());
			JSONObject changed = new JSONObject();
			changed.put("updatedAt", now);
			return Response.ok().entity(changed).build();
		} catch (Exception ex) {
			throw new RuntimeException(ex.getMessage());
		}
	}
	
	@Override
	public void beforeDelete(Key entity) {
		String kind = null; 
		try {
			kind=(String)DatastoreServiceFactory.getDatastoreService().get(entity).getProperty("name");
		} catch (EntityNotFoundException e) {
			throw new RuntimeException(e.getMessage());
		}
		if(UserService.KIND.equals(kind)
				|| RoleService.KIND.equals(kind))
			throw new RuntimeException("Not Supported");
	}
	
	@Override
	public void afterDelete(Key entity){
		//how to drop a table
	}
	
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
				if(!ob.has(key))
					continue;
				Object value=null;
				EmbeddedEntity schema=fields.get(key);
				if(ob.has(key) && ((value=ob.get(key))==null || value==JSONObject.NULL || value.toString().length()==0)){
					if(entity.hasProperty(key))
						entity.removeProperty(key);
					continue;
				}
				TYPES type=TYPES.valueOf((String)schema.getProperty("type"));
				
				if((value instanceof JSONObject) && ((JSONObject)value).has(_OP)){
					JSONObject info=(JSONObject)value;
					OP op=OP.valueOf(info.getString(_OP));
					value=op.eval(type, entity, key, info);
				}else
					value=type.asEntityValue(value);
				
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
			String kind=query.getKind();
			if(KIND.equals(kind) || ApplicationService.KIND.equals(kind))//_schema kind is for internal only
				return;
			TreeMap<String, EmbeddedEntity> fields=types.get(kind);
			if(fields==null)
				throw new RuntimeException(kind+" is not defined as a type");
			
			Iterator it=ob.keys();
			while(it.hasNext()){
				String name=it.next().toString();
				Object value=ob.get(name);
				if("_orderBy".equalsIgnoreCase(name)){
					String field=value.toString();
					if(field.startsWith("-"))
						query.addSort(field.substring(1),SortDirection.DESCENDING);
					else
						query.addSort(field, SortDirection.ASCENDING);
					continue;
				}
				
				EmbeddedEntity schema=fields.get(name);
				if(schema==null)
					continue;
				TYPES type=TYPES.valueOf((String)schema.getProperty("type"));
				
				if(value instanceof JSONObject){
					Iterator it1=((JSONObject)value).keys();
					while(it1.hasNext()){
						String op=it1.next().toString();
						query.addFilter(name, FilterOperator.valueOf(op), type.asEntityValue(((JSONObject)value).get(op)));
					}
				}else 
					query.addFilter(name, FilterOperator.EQUAL, type.asEntityValue(value));
			}
		}
		
		public static synchronized Schema get(String appKey){
			if(!schemas.containsKey(appKey)){
				schemas.put(appKey, new Schema());
			}
			return schemas.get(appKey);
		}
	}	
	
	enum TYPES{
		String, Integer, Float, Boolean,
		Date{
			@Override
			Object asEntityValue(Object value){
				return null;
			}
		}, 
		File, 
		GeoPoint{
			@Override
			Object asEntityValue(Object value){
				return null;
			}
		}, 
		Array{
			@Override
			Object asEntityValue(Object value){
				return null;
			}
		}, 
		Object{
			@Override
			Object asEntityValue(Object value){
				return null;
			}
		}, 
		Pointer;
		
		Object asEntityValue(Object value){
			return value;
		}
	}
	
	static final String _OP="__op";
	
	enum OP{
		Increment{

			@Override
			Object eval(TYPES TYPE, Entity entity, String key, JSONObject op)  throws Exception{
				if(TYPE!=TYPES.Integer)
					throw new RuntimeException("field "+key+" as "+TYPE+" doesn't support increment");
				int amount = op.getInt("amount");
				if(entity.hasProperty(key))
					return ((Integer)entity.getProperty(key))+amount;
				else
					return amount;
			}},
		Add{

			@Override
			Object eval(TYPES TYPE, Entity entity, String key, JSONObject op)  throws Exception{
				if(TYPE!=TYPES.Array)
					throw new RuntimeException("field "+key+" as "+TYPE+" doesn't support increment");
				Object[] value=(Object[])entity.getProperty(key);
				JSONArray objects=op.getJSONArray("objects");
				if(objects==null || objects.length()==0)
					return value;
				
				Object[] result;
				int i=0;
				if(value==null)
					result=new Object[objects.length()];
				else{
					result=new Object[value.length+objects.length()];
					for(Object a : value)
						result[i++]=a;
				}
				for(int l=0; l<objects.length(); l++)
					result[i++]=objects.get(l);
				
				return result;
			}},
		AddUnique{

			@Override
			Object eval(TYPES TYPE, Entity entity, String key, JSONObject op) throws Exception{
				if(TYPE!=TYPES.Array)
					throw new RuntimeException("field "+key+" as "+TYPE+" doesn't support increment");
				Object[] value=(Object[])entity.getProperty(key);
				JSONArray objects=op.getJSONArray("objects");
				if(objects==null || objects.length()==0)
					return value;
				
				Object[] result;
				int i=0;
				if(value==null)
					result=new Object[objects.length()];
				else{
					result=new Object[value.length+objects.length()];
					for(Object a : value)
						result[i++]=a;
				}
				for(int l=0; l<objects.length(); l++)
					result[i++]=objects.get(l);
				
				return result;
				
			}},
		Remove{

			@Override
			Object eval(TYPES TYPE, Entity entity, String key, JSONObject op) throws Exception{
				if(TYPE!=TYPES.Array)
					throw new RuntimeException("field "+key+" as "+TYPE+" doesn't support increment");
				Object[] value=(Object[])entity.getProperty(key);
				JSONArray objects=op.getJSONArray("objects");
				if(objects==null || objects.length()==0)
					return value;
				
				Object[] result;
				int i=0;
				if(value==null)
					result=new Object[objects.length()];
				else{
					result=new Object[value.length+objects.length()];
					for(Object a : value)
						result[i++]=a;
				}
				for(int l=0; l<objects.length(); l++)
					result[i++]=objects.get(l);
				
				return result;
			}
			
		};
		abstract Object eval(TYPES TYPE, Entity entity, String key, JSONObject op) throws Exception;
	}
}
