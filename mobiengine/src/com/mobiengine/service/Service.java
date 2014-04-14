package com.mobiengine.service;

import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.ObjectInput;
import java.io.ObjectInputStream;
import java.io.ObjectOutputStream;

import javax.ws.rs.GET;
import javax.ws.rs.HeaderParam;
import javax.ws.rs.Path;
import javax.ws.rs.PathParam;

import org.codehaus.jettison.json.JSONObject;

import com.google.appengine.api.NamespaceManager;
import com.google.appengine.api.datastore.Blob;
import com.google.appengine.api.datastore.DatastoreServiceFactory;
import com.google.appengine.api.datastore.Entity;
import com.google.appengine.api.datastore.FetchOptions;
import com.google.appengine.api.datastore.KeyFactory;
import com.google.appengine.api.datastore.PreparedQuery;
import com.google.appengine.api.datastore.Query;
import com.google.appengine.api.datastore.Query.FilterOperator;
import com.mobiengine.js.Cloud;
import com.mobiengine.service.SchemaService.Schema;

public class Service{
	public static final String VERSION="1";
	static{
		ApplicationService.initSystem();
	}
	
	Schema schema;

	String kind;
	String appId;
	Entity user;
	private Entity app;
	private Cloud cloud;
	
	public Service(
			@HeaderParam("X-Session-Token") String sessionToken,
			@HeaderParam("X-Application-Id") String appId, @PathParam("kind") String kind) {
		this.appId = appId;
		this.kind = kind;
		initService();
		try{
			if(sessionToken!=null)
				user=UserService.resolvSessionToken(sessionToken);
		}catch(Exception ex){
			
		}
		
	}
	
	protected void initService(){
		try {
			String id=Long.toString(KeyFactory.stringToKey(this.appId).getId());
			if(!ApplicationService.TOP_NAMESPACE.equals(id))
				NamespaceManager.set(ApplicationService.TOP_NAMESPACE);
			app=(DatastoreServiceFactory.getDatastoreService().get(KeyFactory.stringToKey(appId)));
			NamespaceManager.set(id);
			schema = Schema.get(this.appId);
		} catch (Exception e) {
			throw new RuntimeException(e.getMessage());
		}
	}
	
	@GET
	@Path("version")
	public String version() {
		return VERSION;
	}
	
	protected String getUrlRoot(){
		String path=this.getClass().getAnnotation(Path.class).value();
		int i=-1;
		if((i=path.indexOf('{'))!=-1)
			return path.substring(0,i)+this.kind;
		return path;
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

	public Entity getApp() {
		return app;
	}
	
	public Entity getUser(){
		return user;
	}
	
	public Cloud getCloud(){
		if(cloud!=null)
			return cloud;
		
		return cloud=new Cloud(this,app.hasProperty("cloudCode") ? app.getProperty("cloudCode").toString() : "");
	}
}
