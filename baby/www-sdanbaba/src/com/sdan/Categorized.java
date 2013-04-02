package com.sdan;

import javax.ws.rs.Path;

import com.googlecode.objectify.annotation.Entity;
import com.googlecode.objectify.annotation.Unindexed;
import com.yy.app.cms.SlavablePost;
import com.yy.rs.TagAttr;

@Entity
@Unindexed
public class Categorized extends SlavablePost{
	@TagAttr
	public int category;
	
	@Override
	public com.yy.app.cms.Post.View getSlaveView() {
		return new View();
	}

	@Path("i")
	public static class View extends SlavablePost.View{
		
	}
}
