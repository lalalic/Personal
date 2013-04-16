package com.supernaiba.app;

import java.util.Set;

import javax.ws.rs.Path;

import com.googlecode.objectify.annotation.Entity;
import com.googlecode.objectify.annotation.Index;
import com.googlecode.objectify.annotation.OnSave;
import com.yy.app.cms.SlavablePost;
import com.yy.app.site.Profile;
import com.yy.rs.TagAttr;

@Entity
public class Categorized extends SlavablePost{
	@Index
	@TagAttr
	public long category;
	
	@Index
	public int minSuitableAge;
	
	@Index
	public int maxSuitableAge;
	
	@Index
	public int suitableGender;
	
	@Index
	@TagAttr
	public Set<Long> targetCapabilities;
	
	public long refCount;
	
	protected String getCategoryName(){
		return null;
	}
	
	@Override
	public com.yy.app.cms.Post.View getSlaveView() {
		return new View();
	}
	
	@OnSave
	protected void setCategory(){
		String name=this.getCategoryName();
		if(name!=null)
			this.category=Profile.I.tagger.getID(name);
	}

	@Path("_i")
	public static class View extends SlavablePost.View{
		
	}
}
