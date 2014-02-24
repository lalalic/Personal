package com.mobiengine.service;

import java.util.Date;
import java.util.List;

import javax.servlet.http.HttpServletRequest;
import javax.ws.rs.Consumes;
import javax.ws.rs.DELETE;
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
					.header("Location",	this.getUrlRoot() +"/"+ changed.getLong("id"))
					.entity(changed).build();
		} catch (Exception ex) {
			return Response.serverError().entity(ex).build();
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
			DatastoreServiceFactory.getAsyncDatastoreService().put(entity);
			this.afterUpdate(entity);
			JSONObject changed = new JSONObject();
			changed.put("updatedAt", now);
			return Response.ok().entity(changed).build();
		} catch (Exception ex) {
			return Response.serverError().entity(ex).build();
		}
	}

	@DELETE
	@Path("{id:.*}")
	@Consumes(MediaType.APPLICATION_JSON)
	@Produces(MediaType.APPLICATION_JSON)
	public Response remove(@PathParam("id") long id) {
		Key key = KeyFactory.createKey(kind, id);
		this.beforeDelete(key);
		DatastoreServiceFactory.getAsyncDatastoreService().delete(key);
		this.afterDelete(key);
		return Response.ok().build();
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
	public Response get(@QueryParam("where") JSONObject ob) {
		try {
			Query query = new Query(kind);
			if(ob!=null)
				schema.populate(query, ob);
			PreparedQuery pq = DatastoreServiceFactory
					.getAsyncDatastoreService().prepare(query);
			List<Entity> result = pq.asList(FetchOptions.Builder.withLimit(20));
			return Response.ok().entity(result).build();
		} catch (Exception e) {
			return Response.noContent().entity(e).build();
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
