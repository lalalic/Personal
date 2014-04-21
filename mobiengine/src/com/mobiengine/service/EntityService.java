package com.mobiengine.service;

import java.util.ArrayList;
import java.util.Date;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import javax.ws.rs.Consumes;
import javax.ws.rs.DELETE;
import javax.ws.rs.DefaultValue;
import javax.ws.rs.GET;
import javax.ws.rs.HeaderParam;
import javax.ws.rs.POST;
import javax.ws.rs.PUT;
import javax.ws.rs.Path;
import javax.ws.rs.PathParam;
import javax.ws.rs.Produces;
import javax.ws.rs.QueryParam;
import javax.ws.rs.core.MediaType;
import javax.ws.rs.core.Response;

import org.codehaus.jettison.json.JSONArray;
import org.codehaus.jettison.json.JSONObject;

import com.google.appengine.api.datastore.DatastoreService;
import com.google.appengine.api.datastore.DatastoreServiceFactory;
import com.google.appengine.api.datastore.Entity;
import com.google.appengine.api.datastore.EntityNotFoundException;
import com.google.appengine.api.datastore.FetchOptions;
import com.google.appengine.api.datastore.Key;
import com.google.appengine.api.datastore.KeyFactory;
import com.google.appengine.api.datastore.PreparedQuery;
import com.google.appengine.api.datastore.Query;
import com.google.appengine.api.datastore.Query.SortDirection;
import com.google.appengine.api.datastore.Text;
import com.mobiengine.js.Cloud;

@Path(Service.VERSION+"/classes/{kind:\\w+}")
public class EntityService extends Service{
	private Cloud cloud;
	
	public EntityService(
			@HeaderParam("X-Session-Token") String sessionToken,
			@HeaderParam("X-Application-Id") String appId, @PathParam("kind") String kind) {
		super(sessionToken,appId,kind);
	}
	
	public EntityService(Entity app, Entity user, String kind){
		super(app, user,kind);
	}

	@POST
	@Consumes(MediaType.APPLICATION_JSON)
	@Produces(MediaType.APPLICATION_JSON)
	public Response create(JSONObject ob) {
		DatastoreService db = DatastoreServiceFactory.getDatastoreService();
		try {
			Entity entity = new Entity(kind);
			populate(entity, ob);
			this.beforeCreate(entity, ob);
			Date now = new Date();
			entity.setProperty("createdAt", now);
			entity.setProperty("updatedAt", now);
			db.put(entity);
		
			JSONObject changed = new JSONObject();
			changed.put("createdAt", now);
			changed.put("updatedAt", now);
			changed.put("id", entity.getKey().getId());
			
			this.afterCreate(entity, changed);

			return Response
					.ok()
					//.header("Location",	this.getUrlRoot() +"/"+ changed.getLong("id"))
					.entity(changed).build();
		} catch (Exception ex) {
			throw new RuntimeException(ex.getMessage());
		}finally{
		}
	}

	@PUT
	@Path("{id:.*}")
	@Consumes(MediaType.APPLICATION_JSON)
	@Produces(MediaType.APPLICATION_JSON)
	public Response update(@PathParam("id") long id, JSONObject ob) {
		DatastoreService db = DatastoreServiceFactory.getDatastoreService();
		try {
			Key key = KeyFactory.createKey(kind, id);
			Entity entity = db.get(key);
			if (entity == null)
				throw new Exception("Entity Not Exist");
			populate(entity, ob);
			this.beforeUpdate(entity, ob);
			entity.setProperty("updatedAt", new Date());
			db.put(entity);
			this.afterUpdate(entity);
			JSONObject changed = new JSONObject();
			changed.put("updatedAt", entity.getProperty("updatedAt"));
			return Response.ok().entity(changed).build();
		} catch (Exception ex) {
			throw new RuntimeException(ex.getMessage());
		}finally{
			
		}
	}
	
	@PUT
	@Consumes(MediaType.APPLICATION_JSON)
	@Produces(MediaType.APPLICATION_JSON)
	public Response update(JSONArray obs) {
		DatastoreService db = DatastoreServiceFactory.getDatastoreService();
		try {
			Date now=new Date();
			List<Entity> entities=new ArrayList<Entity>();
			for(int i=0,len=obs.length();i<len-1;i++){
				JSONObject ob=obs.getJSONObject(i);
				long id=ob.getLong("id");
				Key key = KeyFactory.createKey(kind, id);
				Entity entity = db.get(key);
				if (entity == null)
					throw new Exception("Entity Not Exist");
				populate(entity, ob);
				entity.setProperty("updatedAt", now);
				entities.add(entity);
			}
			if(!entities.isEmpty())
				db.put(entities);

			JSONObject changed = new JSONObject();
			changed.put("updatedAt", now);
			return Response.ok().entity(changed).build();
		} catch (Exception ex) {
			throw new RuntimeException(ex.getMessage());
		}finally{
			
		}
	}
	
	

	@DELETE
	@Path("{id:.*}")
	@Consumes(MediaType.APPLICATION_JSON)
	@Produces(MediaType.APPLICATION_JSON)
	public Response remove(@PathParam("id") long id) {
		DatastoreService db = DatastoreServiceFactory.getDatastoreService();
		try{
			Key key = KeyFactory.createKey(kind, id);
			this.beforeDelete(key);
			db.delete(key);
			this.afterDelete(key);
			return Response.ok().entity(1).build();
		}finally{

		}
	}

	@GET
	@Path("{id:.*}")
	@Produces(MediaType.APPLICATION_JSON)
	public Response get(@PathParam("id") long id) {
		try {
			return Response
					.ok()
					.entity(DatastoreServiceFactory.getDatastoreService().get(
							KeyFactory.createKey(kind, id))).build();
		} catch (EntityNotFoundException e) {
			return Response.noContent().entity(e).build();
		}
	}

	@GET
	@Produces(MediaType.APPLICATION_JSON)
	public Response get(@QueryParam("where") JSONObject ob, 
			@QueryParam("order") String order, 
			@QueryParam("limit") @DefaultValue("-1") int limit, 
			@QueryParam("skip") @DefaultValue("-1") int skip,
			@QueryParam("keys") String keys,
			@QueryParam("count") boolean count) {
		try {
			Query query = new Query(kind);
			if(ob!=null)
				schema.populate(query, ob);
			FetchOptions opt =FetchOptions.Builder.withDefaults();
			if(limit>-1)
				opt.limit(limit);
			
			if(skip>0)
				opt.offset(skip);
			
			if(order!=null){
				for(String o : order.split(",")){
					if(o.trim().length()==0)
						continue;
					if(o.startsWith("-"))
						query.addSort(o, SortDirection.DESCENDING);
					else
						query.addSort(o, SortDirection.ASCENDING);
				}
			}
			
			if("id".equalsIgnoreCase(keys))
				query.setKeysOnly();
			
			PreparedQuery pq = DatastoreServiceFactory
					.getAsyncDatastoreService().prepare(query);
		
			Map<String,Object> response=new HashMap<String,Object>();
			response.put("results", pq.asList(opt));
			
			if(count)
				response.put("count", pq.countEntities(FetchOptions.Builder.withLimit(0)));
			
			return Response.ok().entity(response).build();
		} catch (Exception e) {
			throw new RuntimeException(e.getMessage());
		}
	}
	
	public void populate(Entity entity, JSONObject ob) throws Exception{
		this.schema.populate(entity, ob);
	}
	
	public Cloud getCloud(){
		if(cloud!=null)
			return cloud;
		Entity app=getApp();
		
		return cloud=new Cloud(this,app.hasProperty("cloudCode") ? ((Text)app.getProperty("cloudCode")).getValue() : "");
	}
	
	public void beforeCreate(Entity entity, JSONObject request) {
		this.getCloud().beforeSave(entity);
	}

	public void afterCreate(Entity entity, JSONObject response) {
		this.getCloud().afterSave(entity);
	}

	public void beforeUpdate(Entity entity, JSONObject request) {
		this.getCloud().beforeSave(entity);
	}

	public void afterUpdate(Entity entity) {
		this.getCloud().afterSave(entity);
	}

	public void beforeDelete(Key entity) {
		this.getCloud().beforeDelete(entity);
	}

	public void afterDelete(Key entity) {
		this.getCloud().afterDelete(entity);
	}
}
