package com.supernaiba.app.game;

import java.net.URI;
import java.net.URISyntaxException;
import java.util.Set;

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
import com.googlecode.objectify.annotation.EntitySubclass;
import com.googlecode.objectify.annotation.Index;
import com.supernaiba.app.Categorized;
import com.yy.app.cms.Post;
import com.yy.app.test.EnclosingModel;
import com.yy.app.test.Runner;
import com.yy.app.test.Test;
import com.yy.app.test.TestValue;
import com.yy.app.test.TestValues;
import com.yy.app.test.Tests;
import com.yy.rs.Caps;

@EntitySubclass
public class Game extends Categorized {
	
	@Index public Set<String> types;
	@Index public Integer fromType=0;
	public String from;
	public Set<String> goal;
	
	public Game(){
		this.ratable=false;
	}
	
	@Override
	public Post.View getSlaveView() {
		return new Share.View();
	}
	
	@Path("youxi")
	public static class View extends Categorized.View{		
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
				@TestValue(field="title",value=Runner.TEST_TITLE)@FormParam("title") String title,
				@TestValue(field="content",value=Runner.TEST_CONTENT)@FormParam("content") String content,
				@FormParam("alias") String alias,
				@FormParam("types") Set<String> types,
				@DefaultValue("0") @FormParam("fromType") int fromType,
				@FormParam("from1") String from1,
				@FormParam("from2") String from2,
				@FormParam("from3") String from3,
				@FormParam("goal") Set<String> goal)
				throws URISyntaxException{
			Objectify store = ObjectifyService.ofy();
			Game game=(Game)this.get(store,ID);
			game.parent=parse(parent);
			game.title=title;
			game.types=types;
			game.fromType=fromType;
			switch(fromType){
			case 1:
				game.from=from1;
				break;
			case 2:
				game.from=from2;
				break;
			case 3:
				game.from=from3;
				break;
			default:
			}
			
			game.goal=goal;
			game.setContent(content);
			store.save().entity(game).now();
			return Response.seeOther(
					new URI("/" + this.path() + "/show/" + game.ID + ".shtml"))
					.build();
		}
		
		@POST
		@Path("slave/post")
		@Consumes(MediaType.APPLICATION_FORM_URLENCODED)
		@Produces(MediaType.TEXT_HTML)
		@Caps
		@Tests({@Test(note="create"), @Test(note="edit")})
		public Response save(
				@TestValues({
					@TestValue,
					@TestValue(field="ID", value=".ID", model=Share.class)}) 
				@DefaultValue("0") @FormParam("ID") long ID,
				
				@TestValue(field="parent", value=".ID", model=EnclosingModel.class) 
				@DefaultValue("0") @FormParam("parent") long parent,
				
				@TestValue(field="title", value=Runner.TEST_TITLE) @FormParam("title") String title,
				@TestValue(field="content", value=Runner.TEST_CONTENT)@FormParam("content") String content,
				@FormParam("tools") String tools,
				@FormParam("suitableAges") Set<String> suitableAge) 
				throws URISyntaxException {
			assert parent!=0;
			Objectify store = ObjectifyService.ofy();
			Share post = (Share) new Share.View().get(store, ID);
			post.parent = parent;
			post.setContent(content);
			post.title=title;
			post.tools=tools;
			post.suitableAge=suitableAge;			
			store.save().entity(post).now();

			return Response.seeOther(
					new URI("/" + this.path() + "/show/" + parent + ".shtml"))
					.build();
		}
	}
}
