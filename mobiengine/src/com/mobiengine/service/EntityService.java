package com.mobiengine.service;

import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.ObjectInput;
import java.io.ObjectInputStream;
import java.io.ObjectOutputStream;
import java.util.Date;
import java.util.List;

import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpSession;
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

import com.google.appengine.api.NamespaceManager;
import com.google.appengine.api.datastore.Blob;
import com.google.appengine.api.datastore.DatastoreServiceFactory;
import com.google.appengine.api.datastore.Entity;
import com.google.appengine.api.datastore.EntityNotFoundException;
import com.google.appengine.api.datastore.FetchOptions;
import com.google.appengine.api.datastore.Key;
import com.google.appengine.api.datastore.KeyFactory;
import com.google.appengine.api.datastore.PreparedQuery;
import com.google.appengine.api.datastore.Query;
import com.google.appengine.api.datastore.Query.FilterOperator;
import com.mobiengine.service.SchemaService.Schema;

@Path(EntityService.VERSION+"/classes/{kind:\\w+}")
public class EntityService {
	public static final String VERSION="1";
	Schema schema;
	String kind;
	String appId;
	long userId;
	String userName;

	HttpSession session;

	public EntityService(
			@Context HttpServletRequest request,
			@HeaderParam("X-Application-Id") String appId, @PathParam("kind") String kind) {
		if(request!=null)
			session=request.getSession();
		this.appId = appId;
		this.kind = kind;
		initService();
	}
	
	protected void initService(){
		if(this.appId==null)
			throw new RuntimeException("No X-Application-Id in header");
		
		if (NamespaceManager.get() == null)
			NamespaceManager.set(Long.toString(KeyFactory.stringToKey(this.appId).getId()));
		schema = Schema.get(this.appId);
		Object userid=session.getAttribute("userid");
		if(userid!=null){
			userId=(Long)userid;
			userName=(String)session.getAttribute("username");
		}
	}

	@GET
	@Path("version")
	public String version() {
		return VERSION;
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
	
	protected String getUrlRoot(){
		String path=this.getClass().getAnnotation(Path.class).value();
		int i=-1;
		if((i=path.indexOf('{'))!=-1)
			return path.substring(0,i)+this.kind;
		return path;
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

	protected int getCount(JSONObject ob) {
		try {
			Query query = new Query(kind);
			schema.populate(query, ob);
			PreparedQuery pq = DatastoreServiceFactory.getDatastoreService()
					.prepare(query);
			return pq.countEntities(FetchOptions.Builder.withDefaults());
		} catch (Exception e) {
			throw new RuntimeException(e.getMessage());
		}
	}

	protected boolean exists(JSONObject ob) {
		try {
			Query query = new Query(kind);
			schema.populate(query, ob);
			query.setKeysOnly();
			PreparedQuery pq = DatastoreServiceFactory.getDatastoreService()
					.prepare(query);
			return pq.countEntities(FetchOptions.Builder.withLimit(1)) == 1;
		} catch (Exception e) {
			throw new RuntimeException(e.getMessage());
		}
	}

	@SuppressWarnings("deprecation")
	protected boolean exists(String field, Object value) {
		try {
			Query query = new Query(kind);
			query.addFilter(field, FilterOperator.EQUAL, value);
			query.setKeysOnly();
			PreparedQuery pq = DatastoreServiceFactory.getDatastoreService()
					.prepare(query);
			return pq.countEntities(FetchOptions.Builder.withLimit(1)) == 1;
		} catch (Exception e) {
			throw new RuntimeException(e.getMessage());
		}
	}

	public void beforeCreate(Entity entity, JSONObject request) {

	}

	public void afterCreate(Entity entity, JSONObject response) {

	}

	public void beforeUpdate(Entity entity, JSONObject request) {

	}

	public void afterUpdate(Entity entity) {

	}

	public void beforeDelete(Key entity) {

	}

	public void afterDelete(Key entity) {

	}

	public static Blob serialize(Object ob) {
		ByteArrayOutputStream bos = new ByteArrayOutputStream();
		ObjectOutputStream oo = null;
		try {
			oo = new ObjectOutputStream(bos);
			oo.writeObject(ob);
			return new Blob(bos.toByteArray());
		} catch (Exception ex) {
			throw new RuntimeException(ex);
		} finally {
			try {
				if (oo != null)
					oo.close();
				if (bos != null)
					bos.close();
			} catch (IOException e) {

			}
		}
	}

	public static Object deserialize(Blob blob) {
		ByteArrayInputStream bis = null;
		ObjectInput in = null;
		try {
			bis = new ByteArrayInputStream(blob.getBytes());
			in = new ObjectInputStream(bis);
			return in.readObject();
		} catch (Exception ex) {
			throw new RuntimeException(ex);
		} finally {
			try {
				if (bis != null)
					bis.close();
				if (in != null)
					in.close();
			} catch (IOException e) {

			}
		}
	}
}
