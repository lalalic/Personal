package com.equ.app.travel;

import java.net.URI;
import java.net.URISyntaxException;
import java.util.Collection;
import java.util.Date;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

import javax.persistence.Transient;
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

import com.google.appengine.api.datastore.Text;
import com.googlecode.objectify.Objectify;
import com.googlecode.objectify.ObjectifyService;
import com.googlecode.objectify.annotation.Indexed;
import com.googlecode.objectify.annotation.Unindexed;
import com.googlecode.objectify.condition.IfNotNull;
import com.sun.jersey.api.view.Viewable;
import com.yy.app.auth.User;
import com.yy.app.cms.SlavablePost;
import com.yy.app.test.EnclosingModel;
import com.yy.app.test.Runner;
import com.yy.app.test.Test;
import com.yy.app.test.TestValue;
import com.yy.app.test.TestValues;
import com.yy.app.test.Tests;
import com.yy.rs.Caps;

/**
 * Vacation--[Plan as Slave]--Travel(from plan)--[Place][Photo] Scenarios:
 * Maomao post a vacation for [route help|find company|discuss route|vote route]
 * some people post plan by refering to existings to change (versioning), by
 * creating all people can favorite/like Maomao select a Plan as final to start
 * travel the group post pic, message during|after travel from pc|phone|pad
 */
@Unindexed
public class Vacation extends SlavablePost {
	private Text route;

	@Indexed(IfNotNull.class)
	public Date start;
	@Indexed(IfNotNull.class)
	public Date end;

	@Indexed
	public int days;

	@Indexed(IfNotNull.class)
	public Set<Long> members;

	@Transient
	private String routeStr;
	@Transient
	public String slave;

	public Vacation() {
		this.ratable = false;
		members = new HashSet<Long>();
	}

	public String getRoute() {
		return this.routeStr;
	}

	public void setRoute(String route) {
		this.route = new Text(route);
		this.routeStr = route;
	}

	@Override
	protected void resolveText() {
		super.resolveText();
		this.routeStr = this.route.getValue();
	}

	public boolean addMember(long user) {
		if (this.members == null)
			this.members = new HashSet<Long>();
		if (this.members.contains(user))
			return false;
		this.members.add(user);
		return true;
	}

	@Transient
	public Collection<User> getMembersInfo() {
		return (Collection<User>) ObjectifyService.begin()
				.get(User.getCurrentUser().getClass(), members).values();
	}

	public boolean removeMember(long user) {
		if (this.members != null && this.members.contains(user)) {
			this.members.remove(user);
			return true;
		}
		return false;
	}

	public boolean joinable(long user) {
		if (ended())
			return false;
		return !members.contains(user);
	}

	public boolean started() {
		return true;
	}

	public boolean ended() {
		return false;
	}

	@Override
	protected void prePersist() {
		super.prePersist();
		if (ID == null || ID == 0)
			this.addMember(this.author);
	}

	public String setSlaveType(String type) {
		this.slave = type;
		return type;
	}

	@Override
	@Transient
	public Route.View getSlaveView() {
		if ("diary".equalsIgnoreCase(this.slave))
			return new Diary.View();
		return new Route.View();
	}

	@Transient
	public List<Poll> getClosedPolls() {
		return ObjectifyService.begin().query(Poll.class)
				.filter("parent", this.ID)
				.filter("closed", true).list();
	}

	@Transient
	private Poll currentPoll;
	@Transient
	private boolean currentPollResolved = false;
	@Transient
	public Poll getCurrentPoll() {
		if (currentPollResolved)
			return currentPoll;
		currentPoll = ObjectifyService.begin().query(Poll.class)
				.filter("parent", this.ID).filter("closed", false).get();
		currentPollResolved = true;
		return currentPoll;
	}

	public boolean iPollable() {
		long userID = User.getCurrentUserID();
		if (userID == 0)
			return false;
		if (!members.contains(userID) && userID != author)
			return false;
		if (this.getCurrentPoll() == null)
			return false;
		if (currentPoll.polledMembers != null
				&& currentPoll.polledMembers.contains(userID))
			return false;

		return true;
	}
	
	@Transient
	public Track getLocus(){
		return ObjectifyService.begin().query(Track.class)
			.filter("author", author)
			.filter("parent", ID).get();
	}

	@Path("plan")
	public static class View extends SlavablePost.View {
		@Override
		public Viewable createUI(long parent) throws InstantiationException,
				IllegalAccessException {
			return new Viewable("/" + this.path() + "/editor.html", super
					.createUI(parent).getModel());
		}

		@Override
		public Viewable editUI(long ID) {
			return new Viewable("/" + this.path() + "/editor.html", super
					.editUI(ID).getModel());
		}

		@GET
		@Path("home")
		@Produces(MediaType.TEXT_HTML)
		@Test
		public Viewable adminSuggestHome() {
			Viewable view = super.adminFavorite();
			@SuppressWarnings("unchecked")
			Map<String, Object> info = (Map<String, Object>) view.getModel();
			info.put("contentMacroName", "homeList");
			return view;
		}

		@POST
		@Path("post")
		@Consumes(MediaType.APPLICATION_FORM_URLENCODED)
		@Produces(MediaType.TEXT_HTML)
		@Caps
		@Tests({ @Test(note = "create"), @Test(note = "edit") })
		public Response save(
				@TestValues({
						@TestValue,
						@TestValue(field = "ID", value = ".ID", model = EnclosingModel.class) }) @DefaultValue("0") @FormParam("ID") long ID,

				@DefaultValue("0") @FormParam("parent") long parent,

				@TestValue(field = "title", value = Runner.TEST_TITLE) @FormParam("title") String title,

				@TestValue(field = "content", value = Runner.TEST_CONTENT) @FormParam("content") String content,
				@FormParam("thumbnail") String thumbnail,
				@FormParam("route") String route,
				@FormParam("start") String start, @FormParam("end") String end,
				@DefaultValue("0") @FormParam("days") int days)
				throws URISyntaxException {

			Objectify store = ObjectifyService.begin();
			Vacation post = (Vacation) this.get(store, ID);
			post.parent = parent;
			post.title = title;
			post.setContent(content);
			post.setRoute(route);
			post.thumbnail = thumbnail;
			post.start = parseDate(start);
			post.end = parseDate(end);
			if (post.start != null && post.end != null)
				post.days = (int) Math.ceil((post.end.getTime() - post.start
						.getTime()) / (1000 * 24 * 60 * 60));
			else if (days != 0)
				post.days = parse(days);
			post.resolveAttrs=true;
			store.put(post);
			post.postPersist();
			return Response.seeOther(
					new URI("/" + this.path() + "/show/" + post.ID + ".shtml"))
					.build();
		}

		@GET
		@Path("join/{ID:\\d+}")
		@Produces(MediaType.APPLICATION_JSON)
		@Caps
		public boolean join(@PathParam("ID") long ID) {
			Vacation v = (Vacation) this.get(ID);
			assert v != null;
			if (!v.ended() && v.addMember(User.getCurrentUserID()))
				ObjectifyService.begin().put(v);
			return true;
		}
		
		public List<Vacation> getOnRoad(){
			return ObjectifyService.begin().query(Vacation.class)
				.filter("author", User.getCurrentUserID())
				.filter("end>=", nextDay(new Date()))
				.filter("start<=", new Date())
				.list();
		}
		
		@SuppressWarnings("deprecation")
		private Date nextDay(final Date d){
			Date d0=new Date(d.getTime());
			d0.setHours(0);
			d0.setMinutes(0);
			d0.setSeconds(0);
			d0.setTime(d0.getTime()+24*60*60*1000);
			return d0;
		}
		
		@GET
		@Path("want2track")
		@Produces(MediaType.TEXT_HTML)
		@Caps
		@Test
		public Viewable want2track(){
			List<Vacation> vacations=ObjectifyService.begin().query(Vacation.class)
				.filter("author", User.getCurrentUserID())
				.filter("end>=", nextDay(new Date()))
				.list();
			return viewable(viewDataModel("What you can track","want2track","vacations",vacations));
		}
	}

}
