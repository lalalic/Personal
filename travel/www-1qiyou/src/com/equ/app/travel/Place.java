package com.equ.app.travel;

import javax.persistence.Id;

import com.googlecode.objectify.annotation.Entity;
import com.googlecode.objectify.annotation.Index;
import com.googlecode.objectify.condition.IfNotNull;
import com.yy.app.cms.SlavablePost;

@Entity
public class Place extends SlavablePost{
	@Id
	public String latlng;//"lat(.xxxxxx),lng(.xxxxxx)"
	
	@Index(IfNotNull.class) public Float maxLat;
	@Index(IfNotNull.class) public Float minLng;
	
	@Override
	public com.yy.app.cms.Post.View getSlaveView() {
		return new Place.View();
	}
	
	public static class View extends SlavablePost.View{
		
	}
}
