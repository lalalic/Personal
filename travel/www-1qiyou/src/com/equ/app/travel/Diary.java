package com.equ.app.travel;

import java.net.URI;
import java.net.URISyntaxException;
import java.util.Map;

import javax.ws.rs.Consumes;
import javax.ws.rs.DefaultValue;
import javax.ws.rs.FormParam;
import javax.ws.rs.GET;
import javax.ws.rs.POST;
import javax.ws.rs.Path;
import javax.ws.rs.Produces;
import javax.ws.rs.core.MediaType;
import javax.ws.rs.core.Response;

import com.googlecode.objectify.Objectify;
import com.googlecode.objectify.ObjectifyService;
import com.googlecode.objectify.annotation.Entity;
import com.sun.jersey.api.view.Viewable;
import com.yy.app.test.EnclosingModel;
import com.yy.app.test.Runner;
import com.yy.app.test.Test;
import com.yy.app.test.TestValue;
import com.yy.app.test.TestValues;
import com.yy.app.test.Tests;
import com.yy.rs.Caps;
import com.yy.rs.Required;

@Entity
@Required("start")
public class Diary extends Vacation {
	@Override
	protected void prePersist() {
		super.prePersist();
	}
	
	
	public Vacation vacation(){
		if(parent!=null && parent!=0)
			return ObjectifyService.ofy().load().type(Vacation.class).id(parent).get();
		return null;
	}
	
	
	@Path("diary")
	public static class View extends Route.View{
		public View(){
			this.template="/index.html";
		}
		@GET
		@Path("home")
		@Produces(MediaType.TEXT_HTML)
		@Test
		public Viewable adminSuggestHome() {
			Viewable view = super.adminFavorite();
			@SuppressWarnings("unchecked")
			Map<String, Object> info = (Map<String, Object>) view.getModel();
			info.put("contentMacroName", "onroadHomeList");
			return view;
		}
		
		
		@POST
		@Path("post")
		@Consumes(MediaType.APPLICATION_FORM_URLENCODED)
		@Produces(MediaType.TEXT_HTML)
		@Caps
		@Tests({@Test(note="create"),@Test(note="edit")})
		public Response save(
				@TestValues({
					@TestValue,
					@TestValue(field="ID", value=".ID", model=EnclosingModel.class)})
				@DefaultValue("0") @FormParam("ID") long ID,
				
				@DefaultValue("0") @FormParam("parent") long parent,
				
				@TestValue(field="title", value=Runner.TEST_TITLE)
				@FormParam("title") String title,
				@TestValue(field="content", value=Runner.TEST_CONTENT)
				@FormParam("content") String content,
				@FormParam("route") String route,
				@FormParam("thumbnail") String thumbnail) 
				throws URISyntaxException {
			Objectify store = ObjectifyService.ofy();
			Diary post = (Diary) this.get(store, ID);
			post.parent = parent;
			post.title = title;
			post.setContent(content);
			post.setRoute(route);
			post.thumbnail=thumbnail;
			post.resolveAttrs=true;
			store.save().entity(post).now();
			post.postPersist();
			return Response.seeOther(
					new URI("/plan/show;"+path()+"/" + parent + ".shtml"))
					.build();
		}
	}
}
