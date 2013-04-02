package com.minicheers.app.homeassit;

import java.net.URI;
import java.net.URISyntaxException;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import javax.persistence.PostLoad;
import javax.persistence.Transient;
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
import com.googlecode.objectify.annotation.Indexed;
import com.googlecode.objectify.annotation.Unindexed;
import com.googlecode.objectify.condition.IfNotNull;
import com.yy.app.AModel;
import com.yy.app.cms.Post;
import com.yy.app.cms.SlavablePost;
import com.yy.app.test.EnclosingModel;
import com.yy.app.test.Runner;
import com.yy.app.test.Test;
import com.yy.app.test.TestValue;
import com.yy.app.test.TestValues;
import com.yy.app.test.Tests;
import com.yy.rs.Caps;
import com.yy.rs.Required;

@Unindexed
@Required("services")
public class HomeAssistant extends SlavablePost {
	public String hometown;
	@Indexed(IfNotNull.class)
	public String iden;
	@Indexed(IfNotNull.class)
	public String country;
	@Indexed(IfNotNull.class)
	public String gender;
	public Integer bodYear;
	public List<String> services;
	
	@Transient public Map<String,Integer> serviceRating;
	public List<String> __serviceRating;
	@Transient public Map<String,Integer> sumRating;
	public List<String> __sumRating;
	
	@Override
	public Post.View getSlaveView() {
		return new Share.View();
	}
	
	@Override
	protected void prePersist() {
		super.prePersist();
		if(serviceRating!=null){
			__serviceRating=new ArrayList<String>();
			for(String key : serviceRating.keySet())
				__serviceRating.add(key+";"+serviceRating.get(key));
		}
		
		if(sumRating!=null){
			__sumRating=new ArrayList<String>();
			for(String key : sumRating.keySet())
				__sumRating.add(key+";"+sumRating.get(key));
		}
	}

	@PostLoad
	protected void postLoad(){
		if(__serviceRating!=null){
			serviceRating=new HashMap<String,Integer>();
			for(String item : __serviceRating){
				String[] data=item.split(";");
				serviceRating.put(data[0], Integer.parseInt(data[1]));
			}
		}
		if(__sumRating!=null){
			sumRating=new HashMap<String,Integer>();
			for(String item : __sumRating){
				String[] data=item.split(";");
				sumRating.put(data[0], Integer.parseInt(data[1]));
			}
		}
	}

	@Override
	protected AModel initTester(AModel tester) {
		HomeAssistant assis = (HomeAssistant)super.initTester(tester);
		assis.services=new ArrayList<String>();
		assis.services.add("a");
		assis.services.add("b");
		return assis;
	}

	@Path("jiazhen")
	public static class View extends SlavablePost.View{
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
				@TestValue(field="title", value=Runner.TEST_TITLE) @FormParam("title") String title,
				@TestValue(field="content", value=Runner.TEST_CONTENT)@FormParam("content") String content,
				@FormParam("iden") String iden,
				@FormParam("hometown") String hometown,
				@FormParam("gender") String gender,
				@FormParam("bodYear") int bodYear,
				@FormParam("country") String country,
				@TestValue(field="services", values={"a","b"})@FormParam("services") List<String> services)
				throws URISyntaxException{
			Objectify store = ObjectifyService.begin();
			HomeAssistant assist=(HomeAssistant)this.get(store,ID);
			assist.parent=parse(parent);
			assist.title=title;
			assist.setContent(content);
			assist.iden=iden;
			assist.hometown=hometown;
			assist.country=country;
			assist.bodYear=bodYear;
			assist.services=services;
			store.put(assist);
			return Response.seeOther(
					new URI("/" + this.path() + "/show/" + assist.ID + ".shtml"))
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
				@FormParam("generalRating") int generalRating,
				@TestValue(field="therating", values={"30","40"})@FormParam("therating") List<Integer> rating) 
				throws URISyntaxException {
			assert parent>0;
			List<AModel> models = new ArrayList<AModel>();
			Objectify store = ObjectifyService.begin();
			Share post = (Share) new Share.View().get(store, ID);
			models.add(post);
			post.parent = parent;
			post.setContent(content);
			post.title=title;
			post.generalRating=generalRating;
			
			Map<String, Integer> serviceRating=new HashMap<String,Integer>();
			post.serviceRating=serviceRating;
			
			synchronized(getClass()){
				HomeAssistant assist=(HomeAssistant)this.get(parent);
				models.add(assist);
				List<String> services=assist.services;
				
				Map<String, Integer> sumRating=assist.sumRating;
				if(sumRating==null)
					sumRating=assist.sumRating=new HashMap<String,Integer>();
				Map<String, Integer> parentRating=assist.serviceRating;
				if(parentRating==null)
					parentRating=assist.serviceRating=new HashMap<String,Integer>();
				String service;
				int arate;
				assist.ratingCount++;
				if(services!=null){
					for(int i=0; i<services.size();i++){
						arate=rating.get(i);
						service=services.get(i);
						serviceRating.put(service, arate);
						sumRating.put(service, 
								arate+=(sumRating.containsKey(service) ? sumRating.get(service) : 0));
						parentRating.put(service, arate/assist.ratingCount);
					}
				}
				assist.generalRatingSum+=generalRating;
				assist.generalRating=assist.generalRatingSum/assist.ratingCount;
				store.put(models);
			}
			
			return Response.seeOther(
					new URI("/" + this.path() + "/show/" + parent + ".shtml"))
					.build();
		}
	}
}
