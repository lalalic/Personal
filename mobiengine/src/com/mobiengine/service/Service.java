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

import com.mobiengine.js.Cloud;
import com.mobiengine.service.SchemaService.Schema;
import com.mongodb.BasicDBObject;

public class Service{
	private static String TOP_APPID="agl3d3d6aXB3ZWJyEQsSBF9hcHAYgICAgICAgAoM";
	public static final String VERSION="1";
	static String TOP_NAMESPACE=null;
	static String TOP_APPKEY=null;

	Schema schema;

	String kind;
	BasicDBObject user;
	BasicDBObject app;
	
	Cloud cloud;
	
	public Service(
			@HeaderParam("X-Session-Token") String sessionToken,
			@HeaderParam("X-Application-Id") String appId, @PathParam("kind") String kind) {
		if(TOP_NAMESPACE==null)
			throw new RuntimeException("System is not initialized");
		if(TOP_APPID.equals(appId))
			appId=TOP_APPKEY;	
		
		this.kind = kind;
		try {
			if(!TOP_NAMESPACE.equals(appId))
				NamespaceManager.set(TOP_NAMESPACE);
			app=(DatastoreServiceFactory.getDatastoreService().get(KeyFactory.stringToKey(appId)));
			NamespaceManager.set(id);
			schema = Schema.get(id);
			
			try {
				if(sessionToken!=null)
					user=UserService.resolvSessionToken(sessionToken);
			} catch (EntityNotFoundException e) {
				/**
				 * when mobiengine proxy application to retrieve data
				 * User is from mobiengine application
				 */
				String rawNS=NamespaceManager.get();
				NamespaceManager.set(TOP_NAMESPACE);
				user=UserService.resolvSessionToken(sessionToken);
				NamespaceManager.set(rawNS);
			}
		} catch (Exception e) {
			throw new RuntimeException(e.getMessage());
		}
		
		
	}
	
	public Service(Entity app, Entity user, String kind){
		this.app=app;
		this.user=user;
		this.kind=kind;
		if(app!=null){
			NamespaceManager.set(this.app.getKey().getId()+"");
			schema = Schema.get(NamespaceManager.get());
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

	public Entity getApp() {
		return app;
	}
	
	public Entity getUser(){
		return user;
	}
	
	public String getKind(){
		return this.kind;
	}
	
	public Cloud getCloud(){
		if(cloud!=null)
			return cloud;
		if(app!=null)
			return cloud=new Cloud(this,app.hasProperty("cloudCode") ? ((Text)app.getProperty("cloudCode")).getValue() : "");
		return null;
	}
}
