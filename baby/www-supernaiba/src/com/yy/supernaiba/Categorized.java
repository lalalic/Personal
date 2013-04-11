package com.yy.supernaiba;

import javax.ws.rs.Path;

import com.googlecode.objectify.annotation.Entity;
import com.googlecode.objectify.annotation.Index;
import com.yy.app.cms.SlavablePost;
import com.yy.rs.TagAttr;

@Entity
public class Categorized extends SlavablePost{
	@Index
	@TagAttr
	public int category;
	
	@Index
	public int minSuitableAge;
	
	@Index
	public int maxSuitableAge;
	
	@Index
	public int suitableGender;
	
	public long refCount;
	
	@Override
	public com.yy.app.cms.Post.View getSlaveView() {
		return new View();
	}

	@Path("i")
	public static class View extends SlavablePost.View{
		
	}
}
