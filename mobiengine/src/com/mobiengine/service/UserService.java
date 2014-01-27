package com.mobiengine.service;

import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;

import javax.servlet.http.HttpServletRequest;
import javax.ws.rs.Consumes;
import javax.ws.rs.GET;
import javax.ws.rs.HeaderParam;
import javax.ws.rs.POST;
import javax.ws.rs.Path;
import javax.ws.rs.Produces;
import javax.ws.rs.QueryParam;
import javax.ws.rs.core.Context;
import javax.ws.rs.core.MediaType;
import javax.ws.rs.core.Response;
import javax.ws.rs.core.Response.Status;

import org.codehaus.jettison.json.JSONException;
import org.codehaus.jettison.json.JSONObject;

import com.google.appengine.api.datastore.DatastoreServiceFactory;
import com.google.appengine.api.datastore.Entity;
import com.google.appengine.api.datastore.EntityNotFoundException;
import com.google.appengine.api.datastore.Key;
import com.google.appengine.api.datastore.KeyFactory;
import com.google.appengine.api.datastore.Query;
import com.google.appengine.api.datastore.Query.FilterOperator;
import com.mobiengine.service.SchemaService.TYPES;
import com.sun.jersey.core.util.Base64;

@Path(Service.VERSION+"/users")
public class UserService extends EntityService{
	public final static String KIND="_user";
	public UserService(@Context HttpServletRequest request,@HeaderParam("X-Application-Id")String appId){
		super(request,appId, KIND);
	}
	
	protected String getUrlRoot(){
		return this.getClass().getAnnotation(Path.class).value();
	}
	
	@Override
	public void beforeCreate(Entity user, JSONObject request){
		String name=(String)user.getProperty("username");
		String password=(String)user.getProperty("password");
		
		if (name == null || name.length() == 0)
			throw new RuntimeException("user name can't be empty.");
		
		if (password == null || password.length() == 0)
			throw new RuntimeException("password can't be empty.");
		
		if(this.exists("username", name))
			throw new RuntimeException("user name has already been registered.");
		
		user.setUnindexedProperty("password", encrypt(password));
	}
	
	@Override
	public void afterCreate(Entity user, JSONObject response){
		try {
			session.setAttribute("userid", user.getKey().getId());
			session.setAttribute("username", user.getProperty("username"));
			response.put("sessionToken", getSessionToken(user));
		} catch (JSONException ex) {
			throw new RuntimeException(ex);
		}
	}
	
	protected static String getSessionToken(Entity user){
		return new String(Base64.encode(KeyFactory.keyToString(user.getKey())));
	}
	
	@SuppressWarnings("deprecation")
	protected static Entity getByName(String name){
		Query query=new Query(KIND);
		query.addFilter("username", FilterOperator.EQUAL, name);
		return DatastoreServiceFactory.getDatastoreService()
			.prepare(query)
			.asSingleEntity();
	}
	
	private String encrypt(String msg){
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
		public RequestPasswordResetService(@Context HttpServletRequest request,@HeaderParam("X-Application-Id")String appId){
			super(request,appId,KIND);
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
		public VerifyService(@Context HttpServletRequest request,@HeaderParam("X-Application-Id")String appId){
			super(request,appId,KIND);
		}
		@GET
		@Produces(MediaType.APPLICATION_JSON)
		public Response verifySession(@HeaderParam("X-Session-Token") String sessionKey){
			Key key=KeyFactory.stringToKey(new String(Base64.decode(sessionKey)));
			try {
				if(KIND.equals(key.getKind())){
					Entity user=DatastoreServiceFactory.getDatastoreService().get(key);
					if(user!=null){
						user.setProperty("sessionToken", getSessionToken(user));
						session.setAttribute("userid", user.getKey().getId());
						session.setAttribute("username", user.getProperty("username"));
						user.removeProperty("password");
						return Response.ok().entity(user).build();
					}
				}
			} catch (EntityNotFoundException e) {
				
			}
			throw new RuntimeException("Don't hack me");
		}
	}
	@Path(Service.VERSION+"/login")
	public static class LoginService extends Service{
		public LoginService(@Context HttpServletRequest request,@HeaderParam("X-Application-Id")String appId){
			super(request,appId,KIND);
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
				return Response.status(Status.NOT_FOUND).build();
			
			MessageDigest digest;
			try {
				digest = java.security.MessageDigest.getInstance("MD5");
				digest.update(password.getBytes());
				if (new String(digest.digest()).equals(user.getProperty("password"))){
					user.setProperty("sessionToken", getSessionToken(user));
					session.setAttribute("userid", user.getKey().getId());
					session.setAttribute("username", user.getProperty("username"));
					user.removeProperty("password");
					return Response.ok().entity(user).build();
				}else
					return Response.serverError()
						.entity(new RuntimeException("username or password is not correct."))
						.build();
			} catch (NoSuchAlgorithmException e) {
				return Response.serverError()
					.entity(new RuntimeException("System error."))
					.build();
			}
		}
	}
}
