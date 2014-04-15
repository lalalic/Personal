package com.mobiengine.js;

import java.io.FileNotFoundException;
import java.io.IOException;

import javax.ws.rs.core.Response;

import org.codehaus.jettison.json.JSONException;
import org.codehaus.jettison.json.JSONObject;
import org.mozilla.javascript.Context;
import org.mozilla.javascript.Function;
import org.mozilla.javascript.NativeObject;
import org.mozilla.javascript.Scriptable;
import org.mozilla.javascript.ScriptableObject;

import com.mobiengine.service.EntityService;
import com.mobiengine.service.RoleService;
import com.mobiengine.service.SchemaService;
import com.mobiengine.service.Service;
import com.mobiengine.service.UserService;

public class RequireSupport extends ScriptableObject {
	private static final long serialVersionUID = -5946043632122729821L;

	@Override
	public String getClassName() {
		return "Require";
	}

	public static void load(Context cx, Scriptable thisObj, Object[] args,
			Function funObj) throws FileNotFoundException, IOException {
		RequireSupport shell = (RequireSupport) getTopLevelScope(thisObj);
		for (int i = 0; i < args.length; i++) 
			shell.load(cx, Context.toString(args[i]));
	}

	private void load(Context cx, String filename)
			throws FileNotFoundException, IOException {
		cx.evaluateReader(this, Cloud.getJSFileReader(filename), filename, 1,null);
	}
	
	public static Object ajax(Context ctx, ScriptableObject scope, Object[] args){
		NativeObject option=(NativeObject)args[0];
		Cloud cloud=(Cloud)args[1];
		String url=(String) Context.jsToJava(option.get("url"),String.class);
		String[] uriInfo=url.split("/");
		int i=0;
		while(i<uriInfo.length-1){
			if(Service.VERSION.equals(uriInfo[i]))
				break;
			i++;
		}
		
		EntityService service=null;
		switch(KIND.valueOf(uriInfo[++i])){
		case users:
			service=new UserService(cloud.service.getApp(), cloud.service.getUser());
			break;
		case roles:
			service=new RoleService(cloud.service.getApp(), cloud.service.getUser());
			break;
		case schemas:
			service=new SchemaService(cloud.service.getApp(), cloud.service.getUser());
			break;
		case classes:
			service=new EntityService(cloud.service.getApp(), cloud.service.getUser(),cloud.service.getKind());
			break;
		}
		
		String http=(String) Context.jsToJava(option.get("type"),String.class);
		JSONObject data= cloud.toJSON(option.get("data"));
		Response response=null;
		switch(HTTP.valueOf(http)){
		case POST:
			response=service.create(data);
			break;
		case GET:
			try {
				response=service.get(data.getJSONObject("where"), 
						data.getString("order"), 
						data.getInt("limit"), 
						data.getInt("skip"), 
						data.getString("keys"), 
						data.getBoolean("count"));
			} catch (JSONException e) {
				e.printStackTrace();
			}
			break;
		case PUT:
			response=service.update(Long.parseLong(uriInfo[++i]), data);
			break;
		case DELETE:
			response=service.remove(Long.parseLong(uriInfo[++i]));
			break;
		}
		
		Object result=response.getEntity();
		
		
		
		return null;//a promise
	}
	
	enum HTTP{POST,PUT,GET,DELETE,PATCH}
	enum KIND{users,roles,schemas,classes}
}
