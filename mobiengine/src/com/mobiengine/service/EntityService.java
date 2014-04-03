package com.mobiengine.service;

import java.util.Date;
import java.util.HashMap;
import java.util.Map;

import javax.servlet.http.HttpServletRequest;
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
import javax.ws.rs.core.Context;
import javax.ws.rs.core.MediaType;
import javax.ws.rs.core.Response;

import org.codehaus.jettison.json.JSONObject;

import com.google.appengine.api.datastore.DatastoreServiceFactory;
import com.google.appengine.api.datastore.Entity;
import com.google.appengine.api.datastore.EntityNotFoundException;
import com.google.appengine.api.datastore.FetchOptions;
import com.google.appengine.api.datastore.Key;
import com.google.appengine.api.datastore.KeyFactory;
import com.google.appengine.api.datastore.PreparedQuery;
import com.google.appengine.api.datastore.Query;
import com.google.appengine.api.datastore.Query.SortDirection;

@Path(Service.VERSION+"/classes/{kind:\\w+}")
public class EntityService extends Service{
	public EntityService(
			@Context HttpServletRequest request,
			@HeaderParam("X-Application-Id") String appId, @PathParam("kind") String kind) {
		super(request,appId,kind);
	}

	@POST
	@Consumes(MediaType.APPLICATION_JSON)
	@Produces(MediaType.APPLICATION_JSON)
	public Response create(JSONObject ob) {
		try {
			Entity entity = new Entity(kind);
			Date now = new Date();
			entity.setProperty("createdAt", now);
			entity.setProperty("updatedAt", now);
			schema.populate(entity, ob);
			this.beforeCreate(entity, ob);
			DatastoreServiceFactory.getDatastoreService().put(entity);
			
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
		}
	}

	@PUT
	@Path("{id:.*}")
	@Consumes(MediaType.APPLICATION_JSON)
	@Produces(MediaType.APPLICATION_JSON)
	public Response update(@PathParam("id") long id, JSONObject ob) {
		try {
			Key key = KeyFactory.createKey(kind, id);
			Entity entity = DatastoreServiceFactory.getDatastoreService().get(
					key);
			if (entity == null)
				throw new Exception("Entity Not Exist");
			Date now = new Date();
			entity.setProperty("updatedAt", now);
			schema.populate(entity, ob);
			this.beforeUpdate(entity, ob);
			DatastoreServiceFactory.getDatastoreService().put(entity);
			this.afterUpdate(entity);
			JSONObject changed = new JSONObject();
			changed.put("updatedAt", now);
			return Response.ok().entity(changed).build();
		} catch (Exception ex) {
			throw new RuntimeException(ex.getMessage());
		}
	}
	

	@DELETE
	@Path("{id:.*}")
	@Consumes(MediaType.APPLICATION_JSON)
	@Produces(MediaType.APPLICATION_JSON)
	public Response remove(@PathParam("id") long id) {
		Key key = KeyFactory.createKey(kind, id);
		this.beforeDelete(key);
		DatastoreServiceFactory.getDatastoreService().delete(key);
		this.afterDelete(key);
		return Response.ok().entity(1).build();
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
