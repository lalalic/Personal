package com.equ.app.travel;

import java.net.URI;
import java.net.URISyntaxException;
import java.util.ArrayList;
import java.util.Collection;
import java.util.List;

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
import com.googlecode.objectify.annotation.Indexed;
import com.googlecode.objectify.annotation.Unindexed;
import com.sun.jersey.api.view.Viewable;
import com.yy.app.AModel;
import com.yy.app.auth.User;
import com.yy.app.test.EnclosingModel;
import com.yy.app.test.Runner;
import com.yy.app.test.Test;
import com.yy.app.test.TestValue;
import com.yy.app.test.TestValues;
import com.yy.app.test.Tests;
import com.yy.rs.Caps;
import com.yy.rs.Required;

@Unindexed
@Required("title")
public class Poll extends AModel {
	
	@Indexed
	public String title;
	public List<Long> items;
	public List<Integer> results;
	public List<Long> polledMembers;
	@Indexed
	public boolean closed;
	
	
	public Collection<Route> getRoutes(){
		if(items!=null && !items.isEmpty())
			return ObjectifyService.begin().get(Route.class, items).values();
		return null;
	}
	
	@Path("poll")
	public static class View extends AModel.View{
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
				@FormParam("items") List<Long> items) 
				throws URISyntaxException {
			Objectify store = ObjectifyService.begin();
			Poll post = (Poll) this.get(store, ID);
			if(post.closed)
				throw new RuntimeException("Closed Poll.");
			post.parent = parent;
			post.title = title;
			post.items=items;
			store.put(post);
			return Response.seeOther(new URI("/plan/show/"+parent+".shtml")).build();
		}
		
		@GET
		@Path("{ID:\\d+}/select/{route:\\d+}")
		@Consumes(MediaType.APPLICATION_FORM_URLENCODED)
		@Produces(MediaType.TEXT_HTML)
		@Caps
		public synchronized Viewable select(
				@PathParam("ID")long ID,
				@PathParam("route")long route ){
			Objectify store=ObjectifyService.begin();
			Poll poll =(Poll) this.get(store, ID);
			if(poll.closed)
				throw new RuntimeException("Closed Poll.");
			
			if(poll.polledMembers==null)
				poll.polledMembers=new ArrayList<Long>();
			
			if(poll.polledMembers.contains(User.getCurrentUserID()))
				throw new RuntimeException("Alreayd Polled.");
			
			int index=poll.items.indexOf(route);
			
			Integer r=poll.results.get(index);
			poll.results.set(index,r+1);
			poll.polledMembers.add(User.getCurrentUserID());
			store.put(poll);
			return viewable(viewDataModel("","pollRoute",
					"template","empty_template",
					"it",ObjectifyService.begin().get(Vacation.class,poll.parent)));
		}
		
		@GET
		@Path("{ID:\\d+}/add/{route:\\d+}")
		@Produces(MediaType.TEXT_HTML)
		@Caps
		public Viewable addItem(@PathParam("ID")long ID, @PathParam("route")long route){
			Objectify store=ObjectifyService.begin();
			Poll poll =(Poll) this.get(store, ID);
			if(poll.closed)
				throw new RuntimeException("Closed Poll.");
			if(poll.items==null)
				poll.items=new ArrayList<Long>();
			if(poll.results==null)
				poll.results=new ArrayList<Integer>();
			poll.items.add(route);
			poll.results.add(new Integer(0));
			store.put(poll);
			return viewable(viewDataModel("","pollRoute",
					"template","empty_template",
					"it",ObjectifyService.begin().get(Vacation.class,poll.parent)));
		}
		
		@GET
		@Path("{ID:\\d+}/remove/{route:\\d+}")
		@Produces(MediaType.TEXT_HTML)
		@Caps
		public Viewable removeItem(@PathParam("ID")long ID, @PathParam("route")long route){
			Objectify store=ObjectifyService.begin();
			Poll poll =(Poll) this.get(store, ID);
			if(poll.closed)
				throw new RuntimeException("Closed Poll.");
			if(poll.items!=null){
				int index=poll.items.indexOf(route);
				if(index!=-1){
					poll.items.remove(index);
					if(poll.results!=null)
						poll.results.remove(index);
				}
			}
			store.put(poll);
			return viewable(viewDataModel("","pollRoute",
					"template","empty_template",
					"it",ObjectifyService.begin().get(Vacation.class,poll.parent)));
		}
		
		@GET
		@Path("{ID:\\d+}/close")
		@Produces(MediaType.TEXT_HTML)
		@Caps
		public Viewable close(@PathParam("ID")long ID){
			Objectify store=ObjectifyService.begin();
			Poll poll =(Poll) this.get(store, ID);
			poll.closed=true;
			store.put(poll);
			return viewable(viewDataModel("","pollRoute",
					"template","empty_template",
					"it",ObjectifyService.begin().get(Vacation.class,poll.parent)));
		}
	}
}
