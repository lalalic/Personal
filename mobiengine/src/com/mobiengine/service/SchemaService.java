package com.mobiengine.service;

import java.util.ArrayList;
import java.util.Date;
import java.util.HashSet;
import java.util.Iterator;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;

import javax.ws.rs.Consumes;
import javax.ws.rs.HeaderParam;
import javax.ws.rs.PUT;
import javax.ws.rs.Path;
import javax.ws.rs.PathParam;
import javax.ws.rs.Produces;
import javax.ws.rs.core.MediaType;
import javax.ws.rs.core.Response;

import org.codehaus.jettison.json.JSONArray;
import org.codehaus.jettison.json.JSONException;
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
import com.google.appengine.api.datastore.Text;
import com.google.appengine.api.search.GeoPoint;

@Path(Service.VERSION+"/schemas")
public class SchemaService extends EntityService{
	private static final String KIND="_schema";
	private static final Map<String, Schema> schemas= new ConcurrentHashMap<String,Schema>();
	private static final String INTERNAL_FIELDS=",createdAt,updatedAt,ACL,id,";
	
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
	
	public static void addField(Entity schema, EmbeddedEntity ... fieldSchemas){
		@SuppressWarnings("unchecked")
		List<EmbeddedEntity> fields=(List<EmbeddedEntity>)schema.getProperty("fields");
		int index=fields.size()-3;
		for(EmbeddedEntity fieldSchema : fieldSchemas)
			fields.add(index++,fieldSchema);
	}
	
	public static EmbeddedEntity makeFieldSchema(String name, TYPES type, boolean searchable, boolean unique){
		EmbeddedEntity field=new EmbeddedEntity();
		field.setProperty("name", name);
		if(type==null)
			type=TYPES.String;
		field.setUnindexedProperty("type", type.toString());
		if(searchable && type.indexable())
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

	@Override
	public void beforeCreate(Entity entity, JSONObject ob) {
		String newKind;
		try {
			newKind = ob.getString("name");
		} catch (JSONException e) {
			throw new RuntimeException(e.getMessage());
		}
		//check existence
		if(this.schema.types.containsKey(newKind))
			throw new RuntimeException(newKind + " has already existed.");
		
	}

	@Override
	public void afterCreate(Entity entity, JSONObject response) {
		this.schema.add(entity);
	}

	@Override
	public void beforeUpdate(Entity entity, JSONObject request) {
		
	}

	@Override
	public void afterUpdate(Entity entity) {
		this.schema.add(entity);
	}
	
	@SuppressWarnings("unchecked")
	@Override
	public void populate(Entity entity, JSONObject ob) throws Exception{
		String newKind=ob.getString("name");
		entity.setUnindexedProperty("name",newKind);
		if(UserService.KIND.equals(newKind))
			entity.setUnindexedProperty("fields", UserService.makeSchema().getProperty("fields"));
		else if(RoleService.KIND.equals(newKind))
			entity.setUnindexedProperty("fields", RoleService.makeSchema().getProperty("fields"));
		else
			entity.setUnindexedProperty("fields", makeSchema("a").getProperty("fields"));
		
		Set<String> exist=new HashSet<String>();
		for(EmbeddedEntity field: (List<EmbeddedEntity>)entity.getProperty("fields"))
			exist.add((String)field.getProperty("name"));
		
		if(ob.has("fields")){
			JSONArray fields=ob.getJSONArray("fields");
			for(int i=0, len=fields.length(); i<len; i++){
				JSONObject field=fields.getJSONObject(i);
				String name=field.getString("name");
				if(exist.contains(name))
					continue;
				addField(entity, makeFieldSchema(
						name, 
						field.has("type") ? TYPES.valueOf(field.getString("type")) : TYPES.String,
						field.has("searchable") && field.getBoolean("searchable"),
						field.has("unique") && field.getBoolean("unique")));
				exist.add(name);
			}
		}
	}
	
	@SuppressWarnings("unchecked")
	@PUT
	@Path("{id:.*}/column")
	@Consumes(MediaType.APPLICATION_JSON)
	@Produces(MediaType.APPLICATION_JSON)
	public Response createColumn(@PathParam("id") long id, JSONObject ob) {
		try {
			JSONObject changed = new JSONObject();
			Key key = KeyFactory.createKey(kind, id);
			Entity entity = DatastoreServiceFactory.getDatastoreService().get(
					key);
			if (entity == null)
				throw new Exception("Entity Not Exist");
			String fieldName=ob.getString("name");
			if(INTERNAL_FIELDS.indexOf(","+fieldName+",")!=-1)
				return Response.ok().entity(changed).build();
			
			ConcurrentHashMap<String, EmbeddedEntity> fields=this.schema.types.get(entity.getProperty("name"));
			if(fields.contains(fieldName))
				((List<EmbeddedEntity>)entity.getProperty("fields")).remove(fields.get(fieldName));
			
			EmbeddedEntity newField=null;
			addField(entity, newField=makeFieldSchema(
					fieldName, 
					ob.has("type") ? TYPES.valueOf(ob.getString("type")) : TYPES.String,
					ob.has("searchable") && ob.getBoolean("searchable"),
					ob.has("unique") && ob.getBoolean("unique")));
			entity.setProperty("updatedAt", new Date());
			DatastoreServiceFactory.getAsyncDatastoreService().put(entity);
			fields.put(fieldName, newField);
			
			changed.put("updatedAt", entity.getProperty("updatedAt"));
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
				|| RoleService.KIND.equals(kind)
				|| SchemaService.KIND.equals(kind)
				|| ApplicationService.KIND.equals(kind))
			throw new RuntimeException("Not Supported");
	}
	
	@Override
	public void afterDelete(Key entity){
		//how to drop a table
	}
	
	public static class Schema{
		protected ConcurrentHashMap<String, ConcurrentHashMap<String, EmbeddedEntity>> types=
			new ConcurrentHashMap<String,ConcurrentHashMap<String, EmbeddedEntity>>();
		
		Schema(){
			retrieve();
		}

		protected void retrieve() {
			Query query=new Query(KIND);
			List<Entity> kinds=DatastoreServiceFactory.getDatastoreService()
				.prepare(query)
				.asList(FetchOptions.Builder.withDefaults());
			
			for(Entity kind : kinds)
				this.add(kind);
			
			if(types.isEmpty())
				throw new RuntimeException("Applicaiton doesn't exist");
		}
		
		@SuppressWarnings("unchecked")
		protected void add(Entity kind){
			String name=kind.getProperty("name").toString();
			ConcurrentHashMap<String,EmbeddedEntity> fields=new ConcurrentHashMap<String,EmbeddedEntity>();
			for(EmbeddedEntity field: (List<EmbeddedEntity>)kind.getProperty("fields"))
				fields.put(field.getProperty("name").toString(), field);
			types.put(name, fields);
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
			ob.remove("updatedAt");
			ob.remove("createdAt");
			ob.remove("id");
			String kind=entity.getKind();
			if(KIND.equals(kind) || ApplicationService.KIND.equals(kind))//_schema kind is for internal only
				return;
			ConcurrentHashMap<String, EmbeddedEntity> fields=types.get(kind);
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
				
				if(schema.hasProperty("unindex") || (value instanceof Text))
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
			ConcurrentHashMap<String, EmbeddedEntity> fields=types.get(kind);
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
		
		public static synchronized Schema get(String appID){
			if(!schemas.containsKey(appID)){
				schemas.put(appID, new Schema());
			}
			return schemas.get(appID);
		}
	}	
	
	enum TYPES{
		Integer, Float, Boolean,
		Date, 
		String{
			@Override
			Object asEntityValue(Object value){
				if(value!=null && ((String)value).length()>500)
					return new Text((String)value);
				return value;
			}
		}, 
		File{
			@Override
			Object asEntityValue(Object value){
				if(value!=null)
					return new Text((String)value);
				return value;
			}
		},
		GeoPoint{
			@Override
			Object asEntityValue(Object value) throws Exception{
				JSONObject o=(JSONObject)value;
				return new GeoPoint(o.getDouble("lat"),o.getDouble("lng"));
			}
		}, 
		Array{
			@Override
			Object asEntityValue(Object value) throws Exception{
				JSONArray data=(JSONArray)value;
				List<Object> r=new ArrayList<Object>();
				for(int i=0,len=data.length();i<len;i++)
					r.add(data.get(i));
				return r;
			}
		}, 
		Object{
			@Override
			Object asEntityValue(Object value){
				return ((JSONObject)value).toString();
			}
		}, 
		Pointer{//{_className:'',id:x}
			@Override
			Object asEntityValue(Object value){
				return ((JSONObject)value).toString();
			}
		};
		
		Object asEntityValue(Object value) throws Exception{
			return value;
		}
		
		boolean indexable(){
			switch(this){
			case File:case Array:case Object:
				return false;
			default:
				return true;
			}
		}
	}
	
	static final String _OP="__op";
	
	enum OP{
		Increment{
			@Override
			Object eval(TYPES TYPE, Entity entity, String key, JSONObject op)  throws Exception{
				if(TYPE!=TYPES.Integer)
					throw new RuntimeException("field "+entity.getKind()+"."+key+" as "+TYPE+" doesn't support "+this.toString());
				long amount = op.getLong("amount");
				if(entity.hasProperty(key))
					return ((Long)entity.getProperty(key))+amount;
				else
					return amount;
			}},
		Add{
			@Override
			Object eval(TYPES TYPE, Entity entity, String key, JSONObject op)  throws Exception{
				if(TYPE!=TYPES.Array)
					throw new RuntimeException("field "+entity.getKind()+"."+key+" as "+TYPE+" doesn't support " + this.toString());
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
					throw new RuntimeException("field "+entity.getKind()+"."+key+" as "+TYPE+" doesn't support "+this.toString());
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
					throw new RuntimeException("field "+entity.getKind()+"."+key+" as "+TYPE+" doesn't support "+this.toString());
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
