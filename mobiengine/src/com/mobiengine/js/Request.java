package com.mobiengine.js;

import com.google.appengine.api.datastore.Entity;

public class Request {
	EntityWrapper object,user;
	public Request(Entity entity){
		this.object=new EntityWrapper(entity);
	}
	public Request(Entity entity, Entity user){
		this(entity);
		this.user=new EntityWrapper(user);
	}
}
