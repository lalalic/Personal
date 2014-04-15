package com.mobiengine.js;

import java.io.InputStreamReader;
import java.io.Reader;
import java.io.StringWriter;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;

import org.codehaus.jackson.map.ObjectMapper;
import org.codehaus.jettison.json.JSONObject;
import org.mozilla.javascript.Context;
import org.mozilla.javascript.Function;
import org.mozilla.javascript.NativeJSON;
import org.mozilla.javascript.NativeObject;
import org.mozilla.javascript.Scriptable;
import org.mozilla.javascript.ScriptableObject;
import org.mozilla.javascript.json.JsonParser;
import org.mozilla.javascript.json.JsonParser.ParseException;

import com.google.appengine.api.datastore.Entity;
import com.google.appengine.api.datastore.Key;
import com.mobiengine.provider.JSONObjectMapper;
import com.mobiengine.service.EntityService;


public class Cloud{
	protected static final int BEFORE_SAVE=0;
	protected static final int AFTER_SAVE=1;
	protected static final int BEFORE_DELETE=2;
	protected static final int AFTER_DELETE=3;
	protected static final ObjectMapper JSON=new JSONObjectMapper().getContext(null);
	protected Context ctx;
	protected ScriptableObject scope;
	protected EntityService service;
	protected Response response;
	HashMap<String, HashMap<Integer,List<Function>>> codes=new HashMap<String, HashMap<Integer,List<Function>>>();	
	
	public Cloud(EntityService service, String code) {
		ctx=Context.enter();
		scope=(ScriptableObject)ctx.newObject(sharedScope);
		scope.setPrototype(sharedScope);
		scope.setParentScope(null);
		scope.defineProperty("Cloud", this, ScriptableObject.READONLY);
		try {
			ctx.evaluateReader(scope, getJSFileReader("model.js"), "model.js", 1, null);
			if(code!=null && code.trim().length()>0)
				ctx.evaluateString(scope, code, "main.js", 1, null);
		} catch (Exception e) {
			throw new RuntimeException("Cloud: "+e.getMessage());
		}

		this.service=service;
		response=new Response();
	}

	public void beforeSave(String kind, Function callback){
		getFunctionList(kind,BEFORE_SAVE).add(callback);
	}
	
	public void beforeSave(Entity entity){
		List<Function> callbacks=getFunctionList(entity.getKind(),BEFORE_SAVE);
		if(callbacks.size()==0)
			return;
		try {
			NativeObject request=makeRequest(entity);
			for(Function f : callbacks)
				f.call(ctx, scope, null, new Object[]{makeRequest(entity),response});
			Object maybeChanged=ScriptableObject.callMethod((Scriptable)request.get("object"), "toJSON", new Object[]{});
			JSONObject ob=parse((String)NativeJSON.stringify(ctx, scope, maybeChanged, null, null));
			service.populate(entity, ob);
		} catch (Exception e) {
			throw new RuntimeException("Cloud: "+e.getMessage());
		}
	}
	
	private NativeObject makeRequest(Entity entity){
		NativeObject request=new NativeObject();
		ScriptableObject jsEntity=jsModel(entity);
		ScriptableObject jsUser=jsModel(service.getUser());
		request.put("object", request, jsEntity);
		request.put("user", request, jsUser);
		return request;
	}
	
	private ScriptableObject jsModel(Entity entity){
		ScriptableObject m=null;
		try {
			scope.defineProperty("_temp_data", new JsonParser(ctx,scope).parseValue(stringify(entity)), ScriptableObject.PERMANENT);
			m=(ScriptableObject)ctx.evaluateString(scope, "Model.create('"+entity.getKind()+"',_temp_data)", "", 1, null);
		} catch (ParseException e) {
			throw new RuntimeException("Cloud: "+e.getMessage());
		}finally{
			scope.delete("_temp_data");
		}
		return m;
	}
	
	public void afterSave(String kind, Function callback){
		getFunctionList(kind,AFTER_SAVE).add(callback);
	}
	
	public void afterSave(Entity entity){
		for(Function f : getFunctionList(entity.getKind(),BEFORE_SAVE))
			f.call(ctx, scope, null, new Object[]{makeRequest(entity),response});
	}
	
	public void beforeDelete(String kind, Function callback){
		getFunctionList(kind,BEFORE_DELETE).add(callback);
	}
	
	public void beforeDelete(Key entity){
		
	}
	
	public void afterDelete(String kind, Function callback){
		getFunctionList(kind,AFTER_DELETE).add(callback);
	}
	
	public void afterDelete(Key entity){
		
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
	
	
	private static ScriptableObject sharedScope;
	public static void init(){
		Context ctx=Context.enter();
		try{
			sharedScope = ctx.initStandardObjects(new RequireSupport(), true);
			sharedScope.defineFunctionProperties(new String[]{"load","ajax"}, sharedScope.getClass(), ScriptableObject.DONTENUM);
		    sharedScope.defineProperty("arguments", ctx.newArray(sharedScope, new Object[] {}), ScriptableObject.DONTENUM);

		    ctx.evaluateReader(sharedScope, getJSFileReader("underscore-min.js"), "underscore-min.js", 1, null);
			ctx.evaluateReader(sharedScope, getJSFileReader("backbone-min.js"), "backbone-min.js", 1, null);
			ctx.evaluateString(sharedScope, "Backbone.ajax=function(o){return ajax(o,Cloud)}", "ajax.js", 1, null);
			sharedScope.sealObject();
		}catch(Exception ex){
			throw new RuntimeException(ex);
		}finally{
			Context.exit();
		}
	}
	
	public static Reader getJSFileReader(String filename){
		return new InputStreamReader(Cloud.class.getClassLoader().getResourceAsStream("libs/"+filename));
	}
	
	public String stringify(Entity entity){
		try {
			StringWriter writer=new StringWriter();
			JSON.writeValue(writer, entity);
			return writer.toString();
		} catch (Exception e) {
			throw new RuntimeException("Cloud: "+e.getMessage());
		}
	}
	
	public JSONObject parse(String json){
		try {
			return new JSONObject(json);
		} catch (Exception e) {
			throw new RuntimeException("Cloud: "+e.getMessage());
		}
	}
	
	public JSONObject toJSON(Object js){
		return parse((String)NativeJSON.stringify(ctx, scope, js, null, null));
	}
}
