package com.equ.app.travel;

import javax.persistence.Id;

import com.googlecode.objectify.annotation.Indexed;
import com.googlecode.objectify.annotation.Unindexed;
import com.googlecode.objectify.condition.IfNotNull;
import com.yy.app.cms.SlavablePost;

@Unindexed
public class Place extends SlavablePost{
	@Id
	public String latlng;//"lat(.xxxxxx),lng(.xxxxxx)"
	
	@Indexed(IfNotNull.class) public Float maxLat;
	@Indexed(IfNotNull.class) public Float minLng;
	
	@Override
	public com.yy.app.cms.Post.View getSlaveView() {
		return new Place.View();
	}
	
	public static class View extends SlavablePost.View{
		
	}
}
