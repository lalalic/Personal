package com.mobiengine.js;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;

import javax.script.ScriptEngine;

import org.mozilla.javascript.Function;

import com.google.appengine.api.datastore.Entity;
import com.google.appengine.api.datastore.Key;


public class Cloud {
	protected static final int BEFORE_SAVE=0;
	protected static final int AFTER_SAVE=1;
	protected static final int BEFORE_DELETE=2;
	protected static final int AFTER_DELETE=3;
	protected ScriptEngine engine;
	HashMap<String, HashMap<Integer,List<Function>>> codes=new HashMap<String, HashMap<Integer,List<Function>>>();	
	
	public Cloud(){
		
	}
	
	public Cloud(ScriptEngine engine) {
		this.engine=engine;
	}

	public void beforeSave(String kind, Function callback){
		getFunctionList(kind,BEFORE_SAVE).add(callback);
	}
	
	public void beforeSave(Entity entity){
		Request request=new Request(entity);
		Response response=new Response();
		for(Function f : getFunctionList(entity.getKind(),BEFORE_SAVE))
			f.call(null, null, null, new Object[]{request,response});
	}

	public void afterSave(String kind, Function callback){
		getFunctionList(kind,AFTER_SAVE).add(callback);
	}
	
	public void afterSave(Entity entity){
		Request request=new Request(entity);
		Response response=new Response();
		for(Function f : getFunctionList(entity.getKind(),BEFORE_SAVE))
			f.call(null, null, null, new Object[]{request,response});
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
	
	
}
