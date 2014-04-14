package com.mobiengine.js;

import com.google.appengine.api.datastore.Entity;

public class EntityWrapper {
	Entity entity;
	public long id;
	public EntityWrapper(Entity entity){
		this.entity=entity;
		id=entity.getKey().getId();
	}
	
	public boolean isNew(){
		return entity.getKey()!=null;
	}
	
	public void set(String name, Object value){
		entity.setProperty(name, value);
	}
	
	public Object get(String name){
		return entity.getProperty(name);
	}
	
	public void save(){
		
	}
	
	public void increment(String key, int value){
		
	}
	
	public void addUnique(String key, Object value){
		
	}
}
