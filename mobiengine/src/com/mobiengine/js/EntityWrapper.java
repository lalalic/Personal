package com.mobiengine.js;

import com.google.appengine.api.datastore.Entity;

public class EntityWrapper {
	Entity entity;
	long id;
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
}
