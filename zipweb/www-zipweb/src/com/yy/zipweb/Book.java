package com.yy.zipweb;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

import javax.ws.rs.Consumes;
import javax.ws.rs.FormParam;
import javax.ws.rs.POST;
import javax.ws.rs.Path;
import javax.ws.rs.Produces;
import javax.ws.rs.core.MediaType;
import javax.ws.rs.core.Response;

import com.googlecode.objectify.Objectify;
import com.googlecode.objectify.ObjectifyService;
import com.googlecode.objectify.annotation.Entity;
import com.googlecode.objectify.annotation.Index;

import com.sun.jersey.core.util.Base64;
import com.yy.app.cms.Post;
import com.yy.app.site.Profile;
import com.yy.app.test.Test;
import com.yy.app.test.Tests;
import com.yy.rs.TagAttr;
import com.yy.rs.Uniques;

@Entity
@Uniques("url")
public class Book extends Post{
	@Index
	public String url;
	public Map<String,Integer> cleaners;
	@TagAttr
	public List<Long> tags;
	public int count;
	
	@Path("book")
	public static class View extends Post.View{
		@POST
		@Path("post")
		@Consumes(MediaType.APPLICATION_FORM_URLENCODED)
		@Produces(MediaType.TEXT_HTML)
		@Tests({ @Test(note = "create"), @Test(note = "edit") })
		public Response save(@FormParam("url") String url, 
				@FormParam("title")String title, 
				@FormParam("thumbnail")String thumbnail,
				@FormParam("cmds")String cmds, 
				@FormParam("tags")String tags, 
				@FormParam("description")String description){
			url=new String(Base64.decode(url));
			if(title!=null)
				title=new String(Base64.decode(title));
			if(thumbnail!=null)
				thumbnail=new String(Base64.decode(thumbnail));
			if(cmds!=null)
				cmds=new String(Base64.decode(cmds));
			if(tags!=null)
				tags=new String(Base64.decode(tags));
			if(description!=null)
				description=new String(Base64.decode(description));
			Objectify store = ObjectifyService.ofy();
			Book post = (Book)this.get("url", url);
			if(post==null){
				post=(Book)this.newInstance();
				post.title = title;
				post.url=url;
				post.excerpt=description;
				post.cleaners=new HashMap<String, Integer>();
				if(cmds!=null)
					post.cleaners.put(cmds, 1);
				post.tags=Profile.I.tagger.parseList(tags,"book.tags");
			}else if(cmds!=null){
				if(post.cleaners.containsKey(cmds))
					post.cleaners.put(cmds, post.cleaners.get(cmds)+1);
				else
					post.cleaners.put(cmds, 1);
			}
			post.count++;
			
			if(thumbnail!=null)
				post.thumbnail=thumbnail;
			
			store.save().entity(post);
			post.postPersist();
			return Response.noContent().build();
		}
	}
	
}
