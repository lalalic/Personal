package com.mobiengine.js;

import com.google.appengine.api.datastore.Entity;


public class User extends EntityWrapper{
	public User(Entity entity) {
		super(entity);
	}
	
	public String getUsername(){
		return (String)entity.getProperty("username");
	}
	
}
