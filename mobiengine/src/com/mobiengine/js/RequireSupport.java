package com.mobiengine.js;

import org.codehaus.jettison.json.JSONArray;
import org.codehaus.jettison.json.JSONObject;
import org.mozilla.javascript.Context;
import org.mozilla.javascript.Function;
import org.mozilla.javascript.NativeArray;
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
		return new AJAX(ctx,scope,(Cloud)args[1]).execute((NativeObject)args[0]);
	}
	
	static class AJAX{
		Context ctx;
		Scriptable scope;
		Cloud cloud;
		
		AJAX(Context ctx, Scriptable scope, Cloud cloud){
			this.ctx=ctx;
			this.scope=scope;
			this.cloud=cloud;
		}
		
		Object execute( NativeObject request) throws Exception{
			HTTP http=HTTP.valueOf(((String) Context.jsToJava(request.get("type"),String.class)).toUpperCase());
			
			http.uri=new URIInfo((String) Context.jsToJava(request.get("url"),String.class));
			
			http.service=http.uri.kind.createService(cloud.service.getApp(), cloud.service.getUser());
			Object rawData=request.get("data");
			Object data=null;
			if(rawData instanceof NativeArray)
				data=new JSONArray(cloud.stringify(rawData));
			else if(rawData!=null)
				data=new JSONObject((String)rawData);
				
			Object r=http.execute(data);
			return new JsonParser(ctx,scope).parseValue(cloud.stringify(r));
		}
		
		class URIInfo{
			KIND kind;
			String[] info;
			long id=0;
			URIInfo(String url){
				info=url.split("/");
				int i=0;
				while(i<info.length-1){
					if(Service.VERSION.equals(info[i]))
						break;
					i++;
				}
				kind=KIND.valueOf(info[++i]);
				if(kind==KIND.classes)
					kind.setKind(info[++i]);
				
				if(info.length-1==i+1)
					id=Long.parseLong(info[++i]);
			}
			
		}
		enum HTTP{
			POST{
				@Override
				Object execute(JSONObject data) {
					return service.create(data).getEntity();
				}

				@Override
				Object execute(JSONArray data) {
					return null;
				}
	
			
			},PUT{

				@Override
				Object execute(JSONObject data) {
					return service.update(uri.id, data).getEntity();
				}

				@Override
				Object execute(JSONArray data) {
					return service.update(data).getEntity();
				}
	
				
			},GET{

				@Override
				Object execute(JSONObject data)  throws Exception{
					if(uri.id!=0)
						return service.get(uri.id).getEntity();
					else
						return service.get(data!=null ? data.getJSONObject("where") : null, 
								data!=null ? data.getString("order") : null, 
								data!=null ? data.getInt("limit") : -1, 
								data!=null ? data.getInt("skip") : -1, 
								data!=null ? data.getString("keys") : null, 
								data!=null ? data.getBoolean("count") : false).getEntity();
				}

				@Override
				Object execute(JSONArray data) {
					return null;
				}
	
				
			},DELETE{

				@Override
				Object execute(JSONObject data){
					 return service.remove(uri.id).getEntity();
				}

				@Override
				Object execute(JSONArray data) {
					return null;
				}
	
				
			};
			EntityService service;
			URIInfo uri;
			Object execute(Object data) throws Exception{
				if(data==null || data instanceof JSONObject)
					return execute((JSONObject)data);
				else if(data instanceof JSONArray)
					return execute((JSONArray)data);
				return null;
			}
			abstract Object execute(JSONObject data) throws Exception;
			abstract Object execute(JSONArray data) throws Exception;
		}
		enum KIND{
			users{
				@Override
				EntityService createService(Entity app, Entity user){
					return new UserService(app,user);
				}
			},roles{
				@Override
				EntityService createService(Entity app, Entity user){
					return new RoleService(app,user);
				}
			},schemas{
				@Override
				EntityService createService(Entity app, Entity user){
					return new SchemaService(app,user);
				}
			},classes{
				String kind;
				void setKind(String kind){
					this.kind=kind;
				}
				@Override
				EntityService createService(Entity app, Entity user){
					return new EntityService(app,user,kind);
				}
			};
			abstract EntityService createService(Entity app, Entity user);
			void setKind(String kind){}
		}
	}
}
