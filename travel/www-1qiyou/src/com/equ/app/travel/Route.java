package com.equ.app.travel;

import java.net.URI;
import java.net.URISyntaxException;
import java.util.Map;

import javax.persistence.Transient;
import javax.ws.rs.Consumes;
import javax.ws.rs.DefaultValue;
import javax.ws.rs.FormParam;
import javax.ws.rs.GET;
import javax.ws.rs.POST;
import javax.ws.rs.Path;
import javax.ws.rs.PathParam;
import javax.ws.rs.Produces;
import javax.ws.rs.core.Context;
import javax.ws.rs.core.MediaType;
import javax.ws.rs.core.Response;
import javax.ws.rs.core.UriInfo;

import com.google.appengine.api.datastore.Text;
import com.googlecode.objectify.Objectify;
import com.googlecode.objectify.ObjectifyService;
import com.googlecode.objectify.annotation.Unindexed;
import com.sun.jersey.api.view.Viewable;
import com.yy.app.SearchFilter;
import com.yy.app.cms.Post;
import com.yy.app.cms.Slave;
import com.yy.app.test.EnclosingModel;
import com.yy.app.test.Runner;
import com.yy.app.test.Test;
import com.yy.app.test.TestValue;
import com.yy.app.test.TestValues;
import com.yy.app.test.Tests;
import com.yy.rs.Caps;

@Unindexed
public class Route extends Slave{
	public static final int STATUS_GOOD=10;
	private Text route;
	@Transient
	private String routeStr;
	
	public Route(){
		ratable=false;
	}
	public String getRoute() {
		return this.routeStr;
	}

	public void setRoute(String route) {
		this.route = new Text(route);
		this.routeStr = route;
	}
	
	public Vacation vacation(){
		if(parent!=null && parent!=0)
			return ObjectifyService.begin().get(Vacation.class,parent);
		return null;
	}
	
	@Override
	protected void resolveText() {
		super.resolveText();
		if(route!=null)
			this.routeStr = this.route.getValue();
	}
	
	@Path("route")
	public static class View extends Post.View{
		public View(){
			this.template="/route.html";
		}
		
		@Override
		@GET
		@Produces({ MediaType.TEXT_HTML })
		@Tests({ @Test, @Test(urlExtra = ";o=-generalRating"),
				@Test(urlExtra = ";o=-votes"),
				@Test(urlExtra = ";o=-favorites") })
		public Viewable showList(@Context UriInfo uriInfo) {
			SearchFilter search = this.getListSearchFilter(uriInfo, getClass()
					.getEnclosingClass());
			search.addFilter("parent", 0);
			String title = search.title;
			if (title == null || title.isEmpty())
				title = "Latest";
			return viewable(viewDataModel(title, "showList", "count",
					search.getCount(), "searchFilter", search, "posts",
					search.list()));
		}
		
		@GET
		@Path("create.html")
		@Produces(MediaType.TEXT_HTML)
		@Caps
		@Test
		public Viewable createUI() throws InstantiationException,
				IllegalAccessException {
			return this.createUI(0);
		}
		
		@GET
		@Path("{ID:\\d+}/create.html")
		@Produces(MediaType.TEXT_HTML)
		@Caps
		@Test
		@Override
		public Viewable createUI(@PathParam("ID")long parent) throws InstantiationException,
				IllegalAccessException {
			@SuppressWarnings("unchecked")
			Map<String,Object> data=(Map<String, Object>) super.createUI(parent).getModel();
			data.put("contentMacroName", path()+"PostForm");
			return new Viewable("/" + this.path() + "/editor.html",data );
		}
		
		@Override
		public Viewable editUI(long ID) {
			@SuppressWarnings("unchecked")
			Map<String,Object> data=(Map<String, Object>) super.editUI(ID).getModel();
			data.put("contentMacroName", path()+"PostForm");
			return new Viewable("/" + this.path() + "/editor.html",data);
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
			Objectify store = ObjectifyService.begin();
			Route post = (Route) this.get(store, ID);
			post.parent = parent;
			post.title = title;
			post.setContent(content);
			post.setRoute(route);
			post.thumbnail=thumbnail;
			post.resolveAttrs=true;
			if(parent==0)
				post.status=STATUS_GOOD;
			store.put(post);
			post.postPersist();
			return Response.seeOther(
					new URI(parent!=0 ? "/plan/show/" + parent + ".shtml" : "/route/show/" + post.ID + ".shtml"))
					.build();
		}
		
		
		@GET
		@Path("copy/{id:\\d+}")
		@Produces(MediaType.APPLICATION_JSON)
		public String getRoute(@PathParam("id") long id){
			return ((Route)get(id)).routeStr;
		}
	}

	@Override
	public Post getMaster() {
		return ObjectifyService.begin().get(Vacation.class,parent);
	}

}
