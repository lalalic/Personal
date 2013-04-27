package com.supernaiba.app.account;

import java.util.List;
import java.util.Map;

import javax.servlet.http.HttpServletRequest;
import javax.ws.rs.Consumes;
import javax.ws.rs.DefaultValue;
import javax.ws.rs.FormParam;
import javax.ws.rs.POST;
import javax.ws.rs.Path;
import javax.ws.rs.PathParam;
import javax.ws.rs.Produces;
import javax.ws.rs.core.Context;
import javax.ws.rs.core.MediaType;

import com.googlecode.objectify.Objectify;
import com.googlecode.objectify.ObjectifyService;
import com.googlecode.objectify.Ref;
import com.googlecode.objectify.annotation.Entity;
import com.sun.jersey.api.view.Viewable;
import com.yy.app.auth.User;
import com.yy.app.test.Test;
import com.yy.rs.Caps;
import com.yy.rs.Required;
import com.yy.rs.Uniques;

@Uniques({ "account" })
@Required({ "account" })
@Entity
public class Account extends User {
	public String city;
	public String area;
	public String address;
	public String latlng;
	
	@Override
	public List<Child> getChildren(){
		return ObjectifyService.ofy().load().type(Child.class).filter("parent", this.ID).list();
	}
	
	@Path("user")
	public static class View extends User.View{
		@POST
		@Path("signup.html")
		@Produces(MediaType.TEXT_HTML)
		public Viewable signup(
				@FormParam("account") String account,
				@FormParam("email") String email,
				@FormParam("password") String password,
				@FormParam("passwordAgain") String passwordAgain,
				@FormParam("name") String name,
				@DefaultValue("false") @FormParam("policy") boolean agreePolicy,
				@FormParam("thumbnail") String thumbnail,
				@FormParam("targetURL") @DefaultValue("/")String targetURL,
				@FormParam("childNick") String childNick,
				@FormParam("childBirthday") String childBirthday,
				@FormParam("gender") long gender,
				@Context HttpServletRequest req) {
			Viewable view=super.signup(account, email, password, passwordAgain, name, agreePolicy, thumbnail, targetURL, req);
			if(childNick==null)
				return view;
			@SuppressWarnings("unchecked")
			Map<String, Object> data = (Map<String, Object>) view.getModel();
			if(data.containsKey("error")){
				@SuppressWarnings("unchecked")
				Map<Object,Object> input=(Map<Object,Object>)data.get("input");
				input.put("childNick", childNick);
				input.put("gender", gender);
				input.put("childBirthday", childBirthday);
			}else{
				Child child=new Child();
				child.nick=childNick;
				child.birthday=this.parseDate(childBirthday);
				child.gender=gender;
				child.parent=Ref.create(User.getCurrentUser());
				ObjectifyService.ofy().save().entities(child);
			}
			return view;
		}
		
		@Override
		protected void beforeSave(User user, HttpServletRequest req) {
			Account account=(Account)user;
			account.city=req.getParameter("city");
			account.area=req.getParameter("area");
			account.address=req.getParameter("address");
			account.latlng=req.getParameter("latlng");
		}
		
		@POST
		@Path("child/save")
		@Consumes(MediaType.APPLICATION_FORM_URLENCODED)
		@Produces(MediaType.APPLICATION_JSON)
		@Caps
		public Child save(
				@DefaultValue("0") @FormParam("ID") long ID,
				@FormParam("nick")String nick,
				@FormParam("birthday")String birthday,
				@FormParam("gender")long gender){
			Objectify store=ObjectifyService.ofy();
			Child child=(Child)new Child.View().get(store,ID);
			child.nick=nick;
			child.birthday=this.parseDate(birthday);
			child.gender=gender;
			child.parent=Ref.create(User.getCurrentUser());
			store.save().entity(child).now();
			return child;
		}
		
		@POST
		@Path("child/delete/{ID:\\d+}")
		@Produces(MediaType.APPLICATION_JSON)
		@Caps
		@Test(value=".ID", model=Child.class)
		public boolean deleteChild(@PathParam("ID") long ID){
			Objectify store=ObjectifyService.ofy();
			Child child=store.load().type(Child.class).id(ID).get();
			if(child.parent.getKey().getId()!=User.getCurrentUserID())
				throw new RuntimeException("You don't have right to delete.");
			store.delete().entity(child);
			return true;
		}
		
	}
}
