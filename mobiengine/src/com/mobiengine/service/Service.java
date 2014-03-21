package com.mobiengine.service;

import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.ObjectInput;
import java.io.ObjectInputStream;
import java.io.ObjectOutputStream;

import javax.script.ScriptEngine;
import javax.script.ScriptEngineManager;
import javax.script.ScriptException;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpSession;
import javax.ws.rs.GET;
import javax.ws.rs.HeaderParam;
import javax.ws.rs.Path;
import javax.ws.rs.PathParam;
import javax.ws.rs.core.Context;

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
	HttpSession session;

	String kind;
	String appId;
	long userId;
	String userName;
	private Entity app;
	private Cloud cloud;
	
	public Service(
			@Context HttpServletRequest request,
			@HeaderParam("X-Application-Id") String appId, @PathParam("kind") String kind) {
		if(request!=null){
			session=request.getSession();
			request.setAttribute("service", this);
		}
		this.appId = appId;
		this.kind = kind;
		Object userid=session.getAttribute("userid");
		if(userid!=null){
			userId=(Long)userid;
			userName=(String)session.getAttribute("username");
		}
		
		initService();
	}
	
	protected void initService(){
		try {
			NamespaceManager.set(ApplicationService.TOP_NAMESPACE);
			app=(DatastoreServiceFactory.getDatastoreService().get(KeyFactory.stringToKey(appId)));
			NamespaceManager.set(Long.toString(KeyFactory.stringToKey(this.appId).getId()));
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
	
	public Cloud getCloud(){
		if(cloud!=null)
			return cloud;
		ScriptEngine engine=new ScriptEngineManager().getEngineByName("JavaScript");
		cloud=new Cloud(engine);
		engine.put("Cloud",cloud);
		try {
			if(app.hasProperty("cloudCode"))
				engine.eval(app.getProperty("cloudCode").toString());
		} catch (ScriptException e) {
			
		}
		return cloud;
	}
}
