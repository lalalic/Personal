package com.mobiengine.js;

import java.io.InputStreamReader;
import java.io.Reader;
import java.io.StringWriter;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.Iterator;
import java.util.List;
import java.util.logging.Logger;

import org.codehaus.jackson.map.ObjectMapper;
import org.codehaus.jettison.json.JSONObject;
import org.mozilla.javascript.Context;
import org.mozilla.javascript.Function;
import org.mozilla.javascript.NativeJSON;
import org.mozilla.javascript.NativeObject;
import org.mozilla.javascript.Scriptable;
import org.mozilla.javascript.ScriptableObject;
import org.mozilla.javascript.json.JsonParser;

import com.google.appengine.api.datastore.Entity;
import com.google.appengine.api.datastore.Key;
import com.mobiengine.provider.JSONObjectMapper;
import com.mobiengine.service.Service;
import com.mobiengine.service.UserService;


public class Cloud{
	protected static final int BEFORE_SAVE=0;
	protected static final int AFTER_SAVE=1;
	protected static final int BEFORE_DELETE=2;
	protected static final int AFTER_DELETE=3;
	protected static final ObjectMapper JSON=new JSONObjectMapper().getContext(null);
	private static Logger logger=Logger.getLogger("Cloud");
	private static String AJAX="Backbone.ajax=function(o,r){try{r=ajax(o,Cloud);o.success && o.success(r);return Promise.as(r)}catch(e){o.error && o.error(e); return Promise.error(e);}}";
	
	protected Context ctx;
	protected ScriptableObject scope;
	protected Service service;
	protected Response response;
	HashMap<String, Function> functions=new HashMap<String,Function>();
	HashMap<String, HashMap<Integer,List<Function>>> codes=new HashMap<String, HashMap<Integer,List<Function>>>();
	HashSet<String> ran=new HashSet<String>();
	ScriptableObject jsUser;
	
	public Cloud(Service service, String code) {
		ctx=Context.enter();
		scope=(ScriptableObject)ctx.newObject(sharedScope);
		scope.setPrototype(sharedScope);
		scope.setParentScope(null);
		scope.defineProperty("Cloud", this, ScriptableObject.READONLY);
		ctx.evaluateString(scope, AJAX, "<ajax>", 1, null);
		try {
			if(code!=null && code.trim().length()>0)
				ctx.evaluateString(scope, code, "main.js", 1, null);
		} catch (Exception e) {
			logger.severe(e.getMessage());
			throw new RuntimeException(e);
		}

		this.service=service;
		try {
			jsUser=jsModel(UserService.KIND, service.getUser());
		} catch (Exception e) {
			logger.severe("Cloud:"+e.getMessage());
			throw new RuntimeException(e);
		}
		response=new Response();
	}
	
	public void define(String path, Function callback){
		functions.put(path, callback);
	}
	
	public Object callFunction(String path, String params){
		if(!functions.containsKey(path)){
			logger.warning("Not support cloud function "+path);
			throw new RuntimeException("Not support cloud function "+path);
		}
		Function f=functions.get(path);
		NativeObject request=new NativeObject();
		try {
			request.put("params", request, new JsonParser(ctx,scope).parseValue(params));
			request.put("user", request, jsUser);
			response.object=new NativeObject();
			f.call(ctx, scope, null, new Object[]{request, response});
			return toJSON(response.object);
		} catch (Exception e) {
			logger.severe("Cloud:"+e.getMessage());
			throw new RuntimeException(e);
		}
	}
	public Object callFunction(String path, JSONObject params) throws Exception{
		return callFunction(path, this.stringify(params));
	}
	
	
	public void beforeSave(String kind, Function callback){
		getFunctionList(kind,BEFORE_SAVE).add(callback);
	}
	
	public void afterSave(String kind, Function callback){
		getFunctionList(kind,AFTER_SAVE).add(callback);
	}
	
	public void beforeDelete(String kind, Function callback){
		getFunctionList(kind,BEFORE_DELETE).add(callback);
	}
	
	public void afterDelete(String kind, Function callback){
		getFunctionList(kind,AFTER_DELETE).add(callback);
	}
	

	public void beforeSave(Entity entity, JSONObject req, JSONObject res)throws Exception{
		List<Function> callbacks=getFunctionList(entity.getKind(),BEFORE_SAVE);
		if(callbacks.size()==0 || mayInfiniteLoop(entity.getKind(),"before save"))
			return;
			
		try {
			NativeObject request=new NativeObject();
			request.put("object", request, jsModel(entity.getKind(), request));
			request.put("user", request, jsUser);
			
			response.object= new JsonParser(ctx,scope).parseValue(stringify(res));
			for(Function f : callbacks)
				f.call(ctx, scope, null, new Object[]{request,response});
			
			copy(req, 
					parse((String)NativeJSON.stringify(ctx, scope, 
							ScriptableObject.callMethod((Scriptable)request.get("object"), "toJSON", new Object[]{}), null, null)));
			
			copy(res, parse((String)NativeJSON.stringify(ctx, scope, response.object, null, null)));
			
		} catch (Exception e) {
			logger.severe(e.getMessage());
			throw e;
		}
	}
	
	public void afterSave(Entity entity, JSONObject req, JSONObject res)throws Exception{
		List<Function> callbacks=getFunctionList(entity.getKind(),AFTER_SAVE);
		if(callbacks.size()==0 || mayInfiniteLoop(entity.getKind(), "after save"))
			return;
		
		try {
			NativeObject request=new NativeObject();
			request.put("object", request, jsModel(entity.getKind(), entity));
			request.put("user", request, jsUser);
			response.object=new JsonParser(ctx,scope).parseValue(stringify(res));
			for(Function f : callbacks)
				f.call(ctx, scope, null, new Object[]{request,response});
			
			copy(res, parse((String)NativeJSON.stringify(ctx, scope, response.object, null, null)));
		} catch (Exception e) {
			logger.severe(e.getMessage());
			throw e;
		}
	}
	
	
	public void beforeDelete(Key entity, JSONObject res)throws Exception{
		List<Function> callbacks=getFunctionList(entity.getKind(),BEFORE_DELETE);
		if(callbacks.size()==0 || mayInfiniteLoop(entity.getKind(), "before delete"))
			return;
		
		try {
			NativeObject request=new NativeObject();
			request.put("object", request, ctx.evaluateString(scope, "Model.create('"+entity.getKind()+"',{id:"+entity.getId()+"},{parse:true})", "", 1, null));
			request.put("user", request, jsUser);
			response.object=new JsonParser(ctx,scope).parseValue(stringify(res));
			for(Function f : callbacks)
				f.call(ctx, scope, null, new Object[]{request,response});
			
			copy(res, parse((String)NativeJSON.stringify(ctx, scope, response.object, null, null)));
		} catch (Exception e) {
			logger.severe(e.getMessage());
			throw e;
		}
	}
	
	public void afterDelete(Key entity, JSONObject res)throws Exception{
		List<Function> callbacks=getFunctionList(entity.getKind(),AFTER_DELETE);
		if(callbacks.size()==0 || mayInfiniteLoop(entity.getKind(), "after delete"))
			return;
		
		try {
			NativeObject request=new NativeObject();
			request.put("object", request, ctx.evaluateString(scope, "Model.create('"+entity.getKind()+"',{id:"+entity.getId()+"},{parse:true})", "", 1, null));
			request.put("user", request, jsUser);
			response.object=new JsonParser(ctx,scope).parseValue(stringify(res));
			for(Function f : callbacks)
				f.call(ctx, scope, null, new Object[]{request,response});
			
			copy(res, parse((String)NativeJSON.stringify(ctx, scope, response.object, null, null)));
		} catch (Exception e) {
			logger.severe(e.getMessage());
			throw e;
		}
	}
	
	protected List<Function> getFunctionList(String kind, int type) {
		if(!codes.containsKey(kind))
			codes.put(kind, new HashMap<Integer,List<Function>>());
		
		HashMap<Integer,List<Function>> callbacks=codes.get(kind);
		if(!callbacks.containsKey(type))
			callbacks.put(type, new ArrayList<Function>());
		
		List<Function> functions=callbacks.get(type);
		return functions;
	}
	
	private ScriptableObject jsModel(String kind, Object props) throws Exception{
		ScriptableObject m=null;
		try {
			scope.defineProperty("_temp_data", new JsonParser(ctx,scope).parseValue(stringify(props)), ScriptableObject.PERMANENT);
			m=(ScriptableObject)ctx.evaluateString(scope, "Model.create('"+kind+"',_temp_data,{parse:true})", "", 1, null);
		} catch (Exception e) {
			logger.severe(e.getMessage());
			throw e;
		}finally{
			scope.delete("_temp_data");
		}
		return m;
	}
	
	public void throwException(Object e) throws Exception{
		Context.jsToJava(e, Exception.class);
	}

	@SuppressWarnings({ "unchecked" })
	private void copy(JSONObject raw, JSONObject changed) throws Exception{
		String key;
		for(Iterator<String> it=changed.keys();it.hasNext(); )
			raw.put(key=it.next(), changed.get(key));
	}

	private boolean mayInfiniteLoop(String kind, String op) {
		String running=op+kind;
		if(ran.contains(running)){
			logger.severe("return from possible infinite loop for "+running);
			return true;
		}else
			ran.add(running);
		return false;
	}
	
	private static ScriptableObject sharedScope;
	public static void init(){
		Context ctx=Context.enter();
		try{
			sharedScope = ctx.initStandardObjects(new RequireSupport(), true);
			sharedScope.defineFunctionProperties(new String[]{"load","ajax"}, sharedScope.getClass(), ScriptableObject.DONTENUM);
		    sharedScope.defineProperty("arguments", ctx.newArray(sharedScope, new Object[] {}), ScriptableObject.DONTENUM);
		    sharedScope.defineProperty("console", new Console(), ScriptableObject.READONLY);;

		    ctx.evaluateReader(sharedScope, getJSFileReader("underscore-min.js"), "underscore-min.js", 1, null);
		    ctx.evaluateReader(sharedScope, getJSFileReader("promise.js"), "promise.js", 1, null);
			ctx.evaluateReader(sharedScope, getJSFileReader("backbone-min.js"), "backbone-min.js", 1, null);
			ctx.evaluateReader(sharedScope, getJSFileReader("model.js"), "model.js", 1, null);			
			sharedScope.sealObject();
		}catch(Exception e){
			logger.severe(e.getMessage());
			throw new RuntimeException(e);
		}finally{
			Context.exit();
		}
	}
	
	public static Reader getJSFileReader(String filename){
		return new InputStreamReader(Cloud.class.getClassLoader().getResourceAsStream("libs/"+filename));
	}
	
	public String stringify(Object entity)throws Exception{
		try {
			StringWriter writer=new StringWriter();
			JSON.writeValue(writer, entity);
			return writer.toString();
		} catch (Exception e) {
			logger.severe(e.getMessage());
			throw e;
		}
	}
	
	public JSONObject parse(String json) throws Exception{
		try {
			return new JSONObject(json);
		} catch (Exception e) {
			logger.severe(e.getMessage());
			throw e;
		}
	}
	
	public JSONObject toJSON(Object js) throws Exception{
		try{
			return parse((String)NativeJSON.stringify(ctx, scope, js, null, null));
		}catch(Exception e){
			logger.severe(e.getMessage());
			throw e;
		}
	}
	
	public static class Console{
		public void debug(Object msg){
			logger.finest(msg.toString());
		}
		public void info(Object msg){
			logger.info(msg.toString());
		}
		
		public void warn(Object msg){
			logger.warning(msg.toString());
		}
		
		public void error(Object msg){
			logger.severe(msg.toString());
		}
	}
}
