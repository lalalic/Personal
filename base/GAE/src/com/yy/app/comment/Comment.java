package com.yy.app.comment;

import java.util.ArrayList;
import java.util.Collection;
import java.util.List;

import javax.ws.rs.DefaultValue;
import javax.ws.rs.FormParam;
import javax.ws.rs.GET;
import javax.ws.rs.MatrixParam;
import javax.ws.rs.POST;
import javax.ws.rs.Path;
import javax.ws.rs.PathParam;
import javax.ws.rs.Produces;
import javax.ws.rs.core.MediaType;

import com.googlecode.objectify.ObjectifyService;
import com.googlecode.objectify.annotation.Index;
import com.googlecode.objectify.annotation.Unindex;
import com.googlecode.objectify.condition.IfNotNull;
import com.sun.jersey.api.view.Viewable;
import com.yy.app.AModel;
import com.yy.app.SearchFilter;
import com.yy.app.auth.User;
import com.yy.app.site.Profile;
import com.yy.app.test.Runner;
import com.yy.app.test.Test;
import com.yy.app.test.TestValue;
import com.yy.rs.Required;

@Required({"message","entityID"})
@Unindex
public class Comment extends AModel {
	@Index
	public Long entityID;

	@Index(IfNotNull.class)
	public Long owner;
	public String ownerName;
	public String email;
	public String url;
	public String message;
	public String photoUrl;
	public String audioUrl;

	@Index(IfNotNull.class)
	public Long serial;
	
	public String getCommenter(){
		return ownerName;
	}
	
	

	@Override
	protected AModel initTester(AModel tester) {
		Comment c=(Comment)tester;
		super.initTester(tester);
		c.message=Runner.TEST_CONTENT;
		c.entityID=1l;
		return c;
	}



	@Path("comment")
	
	public static class View extends AModel.View {
		
		@POST
		@Path("add")
		@Produces(MediaType.APPLICATION_JSON)
		@Test
		public Comment add(
				@TestValue(field="ID",value=".ID", model=Comment.class)
				@FormParam("ID") long entityID,
				
				@TestValue(field="comment", value=Runner.TEST_CONTENT)
				@FormParam("comment") String message,
				
				@TestValue(field="name", value=Runner.TEST_TITLE)
				@FormParam("name") String name,
				@FormParam("email") String email,
				@FormParam("url") String url) {
			Comment comment = new Comment();
			comment.message = message;
			comment.entityID = entityID;
			User user=User.getCurrentUser();
			if(user.ID!=0){
				comment.owner = user.ID;
				comment.ownerName = user.getName();
			}else{
				if((Boolean)Profile.I.anonymousComment){
					comment.ownerName=name;
					comment.email=email;
					comment.url=url;
				}else
					throw new RuntimeException("Have to signin to comment. ");
			}
			ObjectifyService.ofy().save().entity(comment).now();
			return comment;
		}
		
		@GET
		@Path("list/{ID:\\d+}.html")
		@Test(value=".ID", model=Comment.class)
		public Viewable showComments(
				@PathParam("ID") long entityID,
				@DefaultValue("0") @MatrixParam("b") int bookmark) {
			return viewable(viewDataModel("Comments","show",
						"entityID", entityID,
						"comments",getComments(entityID,bookmark)));
		}
		
		@GET
		@Path("list/{ID:\\d+}")
		@Produces(MediaType.APPLICATION_JSON)
		@SuppressWarnings("unchecked")
		@Test(value=".ID", model=Comment.class)
		public List<Comment> getComments(
				@PathParam("ID") long entityID,
				@DefaultValue("0") @MatrixParam("b") int bookmark) {
			SearchFilter search=new SearchFilter(Comment.class);
			search.bookmark=bookmark;
			search.addFilter("entityID", entityID);
			return search.list();
		}

		@Override
		@GET
		@Path("get/{IDs:\\d+(,\\d+)*}")
		@Produces(MediaType.APPLICATION_JSON)
		@Test(value=".ID", model=Comment.class)
		public Collection<Object> list(@PathParam("IDs") String IDs){
			List<Object> comments=new ArrayList<Object>();
			for(String ID: IDs.split(","))
				comments.addAll(getComments(Long.parseLong(ID),0));
			return comments;
		}
	}
}
