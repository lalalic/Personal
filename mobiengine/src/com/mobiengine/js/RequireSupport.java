package com.mobiengine.js;

import org.codehaus.jettison.json.JSONObject;
import org.mozilla.javascript.Context;
import org.mozilla.javascript.Function;
import org.mozilla.javascript.NativeObject;
import org.mozilla.javascript.Scriptable;
import org.mozilla.javascript.ScriptableObject;
import org.mozilla.javascript.json.JsonParser;

import com.google.appengine.api.datastore.Entity;
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
			Function funObj) throws Exception {
		RequireSupport shell = (RequireSupport) getTopLevelScope(thisObj);
		for (int i = 0; i < args.length; i++){
			shell.load(cx, Context.toString(args[i]));
		}
	}

	private void load(Context cx, String filename)throws Exception {
		cx.evaluateReader(this, Cloud.getJSFileReader(filename), filename, 1,null);
	}

	
	public static Object ajax(Context ctx, Scriptable scope, Object[] args,Function funObj) 
		throws Exception{
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
		Entity app=cloud.service.getApp();
		Entity user=cloud.service.getUser();
		switch(KIND.valueOf(uriInfo[++i])){
		case users:
			service=new UserService(app,user);
			break;
		case roles:
			service=new RoleService(app,user);
			break;
		case schemas:
			service=new SchemaService(app,user);
			break;
		case classes:
			service=new EntityService(app,user,uriInfo[++i]);
			break;
		}
		
		String http=(String) Context.jsToJava(option.get("type"),String.class);
		String oData=(String)option.get("data");
		JSONObject data= oData!=null ? cloud.parse(oData) : null;
		switch(HTTP.valueOf(http)){
		case POST:
			return new JsonParser(ctx,scope).parseValue(cloud.stringify(service.create(data).getEntity()));
		case GET:
			if(uriInfo.length-1==++i)
				return new JsonParser(ctx,scope).parseValue(cloud.stringify(service.get(Long.parseLong(uriInfo[i])).getEntity()));
			
			return new JsonParser(ctx,scope).parseValue(cloud.stringify(service.get(data!=null ? data.getJSONObject("where") : null, 
					data!=null ? data.getString("order") : null, 
					data!=null ? data.getInt("limit") : -1, 
					data!=null ? data.getInt("skip") : -1, 
					data!=null ? data.getString("keys") : null, 
					data!=null ? data.getBoolean("count") : false).getEntity()));
		case PUT:
			return new JsonParser(ctx,scope).parseValue(cloud.stringify(service.update(Long.parseLong(uriInfo[++i]), data).getEntity()));
		case DELETE:
			return service.remove(Long.parseLong(uriInfo[++i])).getEntity();
		}
		return null;
	}

	enum HTTP{POST,PUT,GET,DELETE,PATCH}
	enum KIND{users,roles,schemas,classes}
}
