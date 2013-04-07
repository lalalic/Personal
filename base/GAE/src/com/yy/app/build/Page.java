package com.yy.app.build;

import java.net.URI;
import java.net.URISyntaxException;
import java.util.Map;

import javax.ws.rs.Consumes;
import javax.ws.rs.DefaultValue;
import javax.ws.rs.FormParam;
import javax.ws.rs.GET;
import javax.ws.rs.POST;
import javax.ws.rs.Path;
import javax.ws.rs.PathParam;
import javax.ws.rs.Produces;
import javax.ws.rs.core.MediaType;
import javax.ws.rs.core.Response;

import com.googlecode.objectify.Objectify;
import com.googlecode.objectify.ObjectifyService;
import com.googlecode.objectify.annotation.Entity;
import com.sun.jersey.api.view.Viewable;
import com.yy.app.cms.Post;
import com.yy.app.test.Runner;
import com.yy.app.test.Test;
import com.yy.app.test.TestValue;
import com.yy.app.test.TestValues;
import com.yy.app.test.Tests;
import com.yy.rs.AdminUI;
import com.yy.rs.Caps;

@Entity
public class Page extends Post {
	@Path("page")
	
	public static class View extends Post.View {
		@GET
		@Path("admin.html")
		@AdminUI({ "Resource", "Page" })
		@Caps("Page Management")
		@Test
		public Viewable adminUI() {
			Objectify store=ObjectifyService.ofy();
			return viewable(viewDataModel("Page Management", "showList", 
					"serials", store.load().type(Page.class).filter("serial", true).list(),
					"it",store.load().type(Page.class).list()));
		}
		
		@POST
		@Path("post")
		@Consumes(MediaType.APPLICATION_FORM_URLENCODED)
		@Produces(MediaType.TEXT_HTML)
		@Caps
		@Tests({@Test(note="create"), @Test(note="edit")})
		public Response save(
				@TestValues({
					@TestValue, 
					@TestValue(value=".ID", model=Page.class)})
				@DefaultValue("0") @FormParam("ID") long ID,
				
				@DefaultValue("0") @FormParam("parent") long parent,
				
				@TestValue(field="title", value=Runner.TEST_TITLE)
				@FormParam("title") String title,
				@TestValues({
					@TestValue,
					@TestValue(field="guid", value="__tester")
					})
				@FormParam("guid") String guid,
				@DefaultValue("false") @FormParam("serial") boolean serial,
				
				@TestValue(field="content", value=Runner.TEST_CONTENT)
				@FormParam("content") String content) throws URISyntaxException {
			Objectify store = ObjectifyService.ofy();
			Page post = (Page) this.get(store, ID);
			post.parent = parse(parent);
			post.title = title;
			post.guid=guid;
			post.setContent(content);
			store.save().entity(post).now();
			return Response.seeOther(
					new URI("/" + this.path() + "/admin.html"))
					.build();
		}
		
		@SuppressWarnings("unchecked")
		@GET
		@Path("edit/{ID:(\\d+)}.shtml")
		@Caps
		@Override
		@Test(value=".ID", model=Page.class)
		public Viewable editUI(@PathParam("ID") long ID) {
			Viewable view=super.editUI(ID);
			((Map<String,Object>)view.getModel()).put("serials", 
					ObjectifyService.ofy().load().type(Page.class).filter("serial",true).list());
			return view;
		}
	}
}
