package com.mobiengine.filter;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;

import javax.script.ScriptEngine;

import org.mozilla.javascript.Function;


public class Cloud {
	protected static final int BEFORE_SAVE=0;
	protected static final int AFTER_SAVE=1;
	protected static final int BEFORE_DELETE=2;
	protected static final int AFTER_DELETE=3;
	protected ScriptEngine engine;
	HashMap<String, HashMap<Integer,List<Function>>> codes=new HashMap<String, HashMap<Integer,List<Function>>>();	
	
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
	
	protected List<Function> getFunctionList(String kind, int type) {
		if(!codes.containsKey(kind))
			codes.put(kind, new HashMap<Integer,List<Function>>());
		
		HashMap<Integer,List<Function>> callbacks=codes.get(kind);
		if(!callbacks.containsKey(type))
			callbacks.put(type, new ArrayList<Function>());
		
		List<Function> functions=callbacks.get(type);
		return functions;
	}
	
	protected void run(){
		
	}
}
