package com.supernaiba.app.account;

import java.util.List;

import javax.servlet.http.HttpServletRequest;
import javax.ws.rs.Consumes;
import javax.ws.rs.DefaultValue;
import javax.ws.rs.FormParam;
import javax.ws.rs.POST;
import javax.ws.rs.Path;
import javax.ws.rs.PathParam;
import javax.ws.rs.Produces;
import javax.ws.rs.core.MediaType;

import com.googlecode.objectify.Objectify;
import com.googlecode.objectify.ObjectifyService;
import com.googlecode.objectify.annotation.Entity;
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

		@Override
		public User doSignup(String account, String email, String password,
				String passwordAgain, String name, boolean agreePolicy,
				String thumbnail,	HttpServletRequest req) {
			Account user=(Account)super.doSignup(account, email, password, passwordAgain, name,
					agreePolicy, thumbnail,req);
			if(req==null)
				return user;
			String childName=req.getParameter("childNick");
			if(childName==null)
				return user;
			Child child=new Child();
			child.nick=childName;
			child.birthday=this.parseDate(req.getParameter("childBirthday"));
			child.gender=Long.parseLong(req.getParameter("gender"));
			child.parent=user.ID;
			ObjectifyService.ofy().save().entities(child,user).now();
			return user;
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
			child.parent=User.getCurrentUserID();
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
			if(child.parent!=User.getCurrentUserID())
				throw new RuntimeException("You don't have right to delete.");
			store.delete().entity(child);
			return true;
		}
		
	}
}
