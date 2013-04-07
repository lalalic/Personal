package com.equ.app.travel;

import com.googlecode.objectify.ObjectifyService;
import com.googlecode.objectify.annotation.Entity;
import com.googlecode.objectify.annotation.Index;
import com.yy.app.cms.Post;
import com.yy.app.cms.Slave;

@Entity
public class PlaceNote extends Slave{
	@Index
	public String place;

	@Override
	public Post getMaster() {
		return ObjectifyService.ofy().load().type(Place.class).id(parent).get();
	}
}
