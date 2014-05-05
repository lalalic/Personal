package com.mobiengine.service;

import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;

import javax.ws.rs.Consumes;
import javax.ws.rs.GET;
import javax.ws.rs.HeaderParam;
import javax.ws.rs.POST;
import javax.ws.rs.Path;
import javax.ws.rs.Produces;
import javax.ws.rs.QueryParam;
import javax.ws.rs.core.MediaType;
import javax.ws.rs.core.Response;

import org.codehaus.jettison.json.JSONException;
import org.codehaus.jettison.json.JSONObject;

import com.google.appengine.api.datastore.DatastoreServiceFactory;
import com.google.appengine.api.datastore.Entity;
import com.google.appengine.api.datastore.EntityNotFoundException;
import com.google.appengine.api.datastore.KeyFactory;
import com.google.appengine.api.datastore.Query;
import com.google.appengine.api.datastore.Query.FilterOperator;
import com.mobiengine.service.SchemaService.TYPES;
import com.sun.jersey.core.util.Base64;

@Path(Service.VERSION+"/users")
public class UserService extends EntityService{
	public final static String KIND="_user";
	public UserService(@HeaderParam("X-Session-Token") String sessionToken,
			@HeaderParam("X-Application-Id") String appId) {
		super(sessionToken,appId,KIND);
	}
	
	public UserService(Entity app, Entity user) {
		super(app,user,KIND);
	}

	protected String getUrlRoot(){
		return this.getClass().getAnnotation(Path.class).value();
	}
	
	@Override
	public void beforeCreate(Entity user, JSONObject request, JSONObject response)throws Exception{
		String name=(String)request.get("username");
		String password=(String)request.get("password");
		
		if (name == null || name.length() == 0)
			throw new RuntimeException("user name can't be empty.");
		
		if (password == null || password.length() == 0)
			throw new RuntimeException("password can't be empty.");
		
		if(this.exists("username", name))
			throw new RuntimeException("user name has already been registered.");
		request.remove("password");
		user.setUnindexedProperty("password", encrypt(password));
	}
	
	@Override
	public void afterCreate(Entity user, JSONObject request, JSONObject response)throws Exception{
		try {
			response.put("sessionToken", getSessionToken(user));
		} catch (JSONException ex) {
			throw new RuntimeException(ex);
		}
	}
	
	protected static String getSessionToken(Entity user){
		return new String(Base64.encode(user.getKey().getId()+"-"+user.getProperty("username")));
	}
	
	public static Entity resolvSessionToken(String token) throws EntityNotFoundException{
		String[] infos=Base64.base64Decode(token).split("-");
		if(infos.length!=2)
			throw new RuntimeException("token error");
		long id=Long.parseLong(infos[0]);
		String username=infos[1];
		Entity user = DatastoreServiceFactory.getDatastoreService().get(KeyFactory.createKey(KIND, id));
		if(!username.equals(user.getProperty("username")))
			throw new RuntimeException("token error");
		return user;
	}
	
	@SuppressWarnings("deprecation")
	protected static Entity getByName(String name){
		Query query=new Query(KIND);
		query.addFilter("username", FilterOperator.EQUAL, name);
		return DatastoreServiceFactory.getDatastoreService()
			.prepare(query)
			.asSingleEntity();
	}
	
	private static String encrypt(String msg){
		MessageDigest digest;
		try {
			digest = java.security.MessageDigest.getInstance("MD5");
			digest.update(msg.getBytes());
			return new String(digest.digest());
		} catch (NoSuchAlgorithmException e) {
			throw new RuntimeException("System error.");
		}
	}
	
	public static Entity makeSchema(){
		return SchemaService.makeSchema(KIND, 
				SchemaService.makeFieldSchema("username", TYPES.String, true, true),
				SchemaService.makeFieldSchema("password",TYPES.String, false, false),
				SchemaService.makeFieldSchema("email", TYPES.String, true, true));
	}
	
	@Path(Service.VERSION+"/requestPasswordReset")
	public static class RequestPasswordResetService extends Service{
		public RequestPasswordResetService(@HeaderParam("X-Session-Token") String sessionToken,
				@HeaderParam("X-Application-Id") String appId) {
			super(sessionToken,appId,KIND);
		}

		@POST
		@Consumes(MediaType.APPLICATION_JSON)
		@Produces(MediaType.APPLICATION_JSON)
		public Response requestPasswordReset(JSONObject ob){
			return null;
		}
	}
	
	@Path(Service.VERSION+"/me")
	public static class VerifyService extends Service{
		public VerifyService(@HeaderParam("X-Session-Token") String sessionToken,
				@HeaderParam("X-Application-Id") String appId) {
			super(sessionToken,appId,KIND);
		}
		@GET
		@Produces(MediaType.APPLICATION_JSON)
		public Response verifySession(){
			try {
				user.setProperty("sessionToken", getSessionToken(user));
				user.removeProperty("password");
				return Response.ok().entity(user).build();
			} catch (Throwable ex) {
				throw new RuntimeException("Your session has already been expired.");
			}
		}
	}
	@Path(Service.VERSION+"/login")
	public static class LoginService extends Service{
		public LoginService(@HeaderParam("X-Application-Id") String appId) {
			super(null,appId,KIND);
		}

		@GET
		@Produces(MediaType.APPLICATION_JSON)
		public Response login(@QueryParam("username") String name, @QueryParam("password") String password){
			if (name == null || name.length() == 0)
				throw new RuntimeException("user name can't be empty.");
			
			if (password == null || password.length() == 0)
				throw new RuntimeException("password can't be empty.");
			
			Entity user=getByName(name);
			if(user==null)
				throw new RuntimeException("username or password is not correct.");
			
			if (encrypt(password).equals(user.getProperty("password"))){
				user.setProperty("sessionToken", getSessionToken(user));
				user.removeProperty("password");
				return Response.ok().entity(user).build();
			}else
				throw new RuntimeException("username or password is not correct.");
		}
	}
}
