package com.yy.supernaiba.task;

import java.util.List;

import javax.ws.rs.Consumes;
import javax.ws.rs.FormParam;
import javax.ws.rs.GET;
import javax.ws.rs.POST;
import javax.ws.rs.Path;
import javax.ws.rs.core.MediaType;
import javax.ws.rs.core.Response;

import com.googlecode.objectify.ObjectifyService;
import com.googlecode.objectify.annotation.Embed;
import com.googlecode.objectify.annotation.Entity;
import com.googlecode.objectify.annotation.Index;
import com.sun.jersey.api.view.Viewable;
import com.yy.app.AModel;
import com.yy.app.auth.User;

@Entity
public class Schedule extends AModel {
	@Index
	public long when;
	
	@Embed
	public Task task;
	
	@Path("task")
	public static class View extends AModel.View{
		@GET
		@Path("today.html")
		public Viewable todayUI(){
			return viewable(viewDataModel("Task","today",
					"schedule",ObjectifyService.ofy().load()
					.type(this.getClass().getEnclosingClass())
					.filter("when", AModel.getDay(null))
					.filter("author",User.currentUserID)
					.first().get()));
		}
		
		@POST
		@Consumes(MediaType.APPLICATION_FORM_URLENCODED)
		@Path("today.html")
		public Response save(
				@FormParam("when") String when,
				@FormParam("cat") List<String> category,
				@FormParam("hours") List<Integer> hours,
				@FormParam("items") List<String> items){
			return Response.noContent().build();
		}
	}
}
