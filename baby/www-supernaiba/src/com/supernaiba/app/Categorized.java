package com.supernaiba.app;

import java.net.URI;
import java.net.URISyntaxException;
import java.util.List;

import javax.ws.rs.Consumes;
import javax.ws.rs.DefaultValue;
import javax.ws.rs.FormParam;
import javax.ws.rs.POST;
import javax.ws.rs.Path;
import javax.ws.rs.Produces;
import javax.ws.rs.core.MediaType;
import javax.ws.rs.core.Response;

import com.googlecode.objectify.Objectify;
import com.googlecode.objectify.ObjectifyService;
import com.googlecode.objectify.annotation.Entity;
import com.googlecode.objectify.annotation.Ignore;
import com.googlecode.objectify.annotation.OnSave;
import com.yy.app.cms.SlavablePost;
import com.yy.app.site.Profile;
import com.yy.app.test.Test;
import com.yy.app.test.Tests;
import com.yy.rs.Caps;
import com.yy.rs.TagAttr;

@Entity
public class Categorized extends SlavablePost{
	@TagAttr("categories")
	@Ignore
	public long category;
	
	@TagAttr("ages")
	@Ignore
	public List<Long> age;

	@TagAttr("gender")
	@Ignore
	public List<Long> gender;
	
	@TagAttr("capabilities")
	@Ignore
	public List<Long> cap;
	
	@TagAttr("duration")
	@Ignore
	public long duration;
	
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

	public static class View extends SlavablePost.View{
		@POST
		@Path("post")
		@Consumes(MediaType.APPLICATION_FORM_URLENCODED)
		@Produces(MediaType.TEXT_HTML)
		@Caps
		@Tests({@Test(note="create"),@Test(note="edit")})
		public Response save(
				@FormParam("ID")long ID,
				@DefaultValue("0") @FormParam("parent") long parent,
				@FormParam("title")String title,
				@FormParam("content")String content,
				@FormParam("age") List<Long> age,
				@FormParam("gender")List<Long> gender,
				@FormParam("cap") List<Long> cap,
				@FormParam("duration") long duration)
				throws URISyntaxException {
			Objectify store = ObjectifyService.ofy();
			Categorized post = (Categorized) this.get(store, ID);
			post.setParent(parent);
			post.title = title;
			post.age=age;
			post.gender=gender;
			post.cap=cap;
			post.duration=duration;
			post.setContent(content);
			store.save().entity(post).now();
			post.postPersist();
			return Response.seeOther(
					new URI("/" + this.path() + "/show/" + post.ID + ".shtml"))
					.build();
		}
	}
}
