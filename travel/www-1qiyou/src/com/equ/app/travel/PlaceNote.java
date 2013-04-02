package com.equ.app.travel;

import com.googlecode.objectify.ObjectifyService;
import com.googlecode.objectify.annotation.Indexed;
import com.googlecode.objectify.annotation.Unindexed;
import com.yy.app.cms.Post;
import com.yy.app.cms.Slave;

@Unindexed
public class PlaceNote extends Slave{
	@Indexed
	public String place;

	@Override
	public Post getMaster() {
		return ObjectifyService.begin().get(Place.class,parent);
	}
}
