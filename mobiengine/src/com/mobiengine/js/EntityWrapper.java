package com.mobiengine.js;

import java.util.concurrent.Future;

import com.google.appengine.api.datastore.Entity;

public class EntityWrapper {
	Entity entity;
	public EntityWrapper(Entity entity){
		this.entity=entity;
	}
	
	public Future save(){
		return null;
	}
	
	public static Entity get(){
		return null;
	}
}
