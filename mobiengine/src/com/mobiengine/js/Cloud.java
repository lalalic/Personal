package com.mobiengine.js;

import java.io.InputStreamReader;
import java.io.Reader;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;

import org.mozilla.javascript.Context;
import org.mozilla.javascript.Function;
import org.mozilla.javascript.ScriptableObject;

import com.google.appengine.api.datastore.Entity;
import com.google.appengine.api.datastore.Key;


public class Cloud{
	protected static final int BEFORE_SAVE=0;
	protected static final int AFTER_SAVE=1;
	protected static final int BEFORE_DELETE=2;
	protected static final int AFTER_DELETE=3;
	protected Context ctx;
	protected ScriptableObject scope;
	HashMap<String, HashMap<Integer,List<Function>>> codes=new HashMap<String, HashMap<Integer,List<Function>>>();	
	
	public Cloud(String code) {
		ctx=Context.enter();
		scope=(ScriptableObject)ctx.newObject(sharedScope);
		scope.setPrototype(sharedScope);
		scope.setParentScope(null);
		scope.defineProperty("Cloud", this, ScriptableObject.READONLY);
		
		if(code!=null && code.trim().length()>0)
			ctx.evaluateString(scope, code, "main.js", 1, null);
	}

	public void beforeSave(String kind, Function callback){
		getFunctionList(kind,BEFORE_SAVE).add(callback);
	}
	
	public void beforeSave(Entity entity){
		Request request=new Request(entity);
		Response response=new Response();
		for(Function f : getFunctionList(entity.getKind(),BEFORE_SAVE))
			f.call(ctx, scope, null, new Object[]{request,response});
	}

	public void afterSave(String kind, Function callback){
		getFunctionList(kind,AFTER_SAVE).add(callback);
	}
	
	public void afterSave(Entity entity){
		Request request=new Request(entity);
		Response response=new Response();
		for(Function f : getFunctionList(entity.getKind(),BEFORE_SAVE))
			f.call(ctx, scope, null, new Object[]{request,response});
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
			sharedScope.defineFunctionProperties(new String[]{"load"}, sharedScope.getClass(), ScriptableObject.DONTENUM);
		    sharedScope.defineProperty("arguments", ctx.newArray(sharedScope, new Object[] {}), ScriptableObject.DONTENUM);

		    ctx.evaluateReader(sharedScope, getJSFileReader("underscore-min.js"), "underscore-min.js", 1, null);
			ctx.evaluateReader(sharedScope, getJSFileReader("backbone-min.js"), "backbone-min.js", 1, null);
			sharedScope.sealObject();
		}catch(Exception ex){
			throw new RuntimeException(ex);
		}finally{
			Context.exit();
		}
	}
	
	public static Reader getJSFileReader(String filename){
		return new InputStreamReader(Cloud.class.getResourceAsStream("libs/"+filename));
	}
}
