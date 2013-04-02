package com.yy.app.cms;

import java.lang.reflect.Field;
import java.net.URI;
import java.net.URISyntaxException;
import java.util.ArrayList;
import java.util.Collection;
import java.util.List;
import java.util.Set;
import java.util.TreeSet;

import javax.persistence.Entity;
import javax.persistence.PostLoad;
import javax.persistence.Transient;
import javax.ws.rs.Consumes;
import javax.ws.rs.DefaultValue;
import javax.ws.rs.FormParam;
import javax.ws.rs.GET;
import javax.ws.rs.POST;
import javax.ws.rs.Path;
import javax.ws.rs.PathParam;
import javax.ws.rs.Produces;
import javax.ws.rs.QueryParam;
import javax.ws.rs.core.Context;
import javax.ws.rs.core.MediaType;
import javax.ws.rs.core.Response;
import javax.ws.rs.core.UriInfo;

import com.google.appengine.api.datastore.Text;
import com.googlecode.objectify.Key;
import com.googlecode.objectify.Objectify;
import com.googlecode.objectify.ObjectifyService;
import com.googlecode.objectify.annotation.Indexed;
import com.googlecode.objectify.annotation.Unindexed;
import com.googlecode.objectify.condition.IfNotNull;
import com.googlecode.objectify.condition.IfTrue;
import com.sun.jersey.api.view.Viewable;
import com.yy.app.AModel;
import com.yy.app.SearchFilter;
import com.yy.app.auth.User;
import com.yy.app.comment.Comment;
import com.yy.app.site.Profile;
import com.yy.app.tag.Tag;
import com.yy.app.test.EnclosingModel;
import com.yy.app.test.Runner;
import com.yy.app.test.Test;
import com.yy.app.test.TestValue;
import com.yy.app.test.TestValues;
import com.yy.app.test.Tests;
import com.yy.provider.oauth.Weibo;
import com.yy.rs.Caps;
import com.yy.rs.TagAttr;
import com.yy.rs.Uniques;

@Entity
@Unindexed
@Uniques("guid")
public class Post extends AModel {
	public static final int STATUS_PRIVATE = 0;
	public static final int STATUS_PUBLISH = 1;
	public static final int STATUS_DRAFT = 2;

	@Indexed(IfTrue.class)
	public Boolean serial;

	@Indexed(IfNotNull.class)
	public String title;
	private Text content;
	public String excerpt;

	@Indexed(IfNotNull.class)
	public Integer status;
	
	public Boolean allowComment = true;
	@Indexed(IfNotNull.class)
	public String guid;

	@Indexed
	public int votes = 0;

	@Indexed
	public int favorites = 0;

	@Indexed
	public int generalRating = 0;
	public int generalRatingSum;
	public int ratingCount = 0;

	@Transient
	transient public boolean votable = true;
	@Transient
	transient public boolean favoritable = true;
	@Transient
	transient public boolean ratable = true;

	@Transient
	transient private String contentStr;

	@Transient
	transient public boolean resolveAttrs = false;

	@Transient
	public boolean supportWeibo = true;

	public String weiboID;

	@PostLoad
	protected void resolveText() {
		if (content != null)
			this.contentStr = this.content.getValue();
	}

	public String getContent() {
		return this.contentStr;
	}

	public void setContent(String content) {
		this.content = new Text(content);
		this.contentStr = content;
	}

	public void removeComments(long entityID) {
		Objectify store = ObjectifyService.begin();
		store.delete(store.query(Comment.class)
				.ancestor(new Key<Post>(this.getClass(), entityID)).fetchKeys());
	}

	@Override
	protected void prePersist() {
		collectTagAttr();
		super.prePersist();
		checkContent();
		makeExcerpt();
	}

	protected void checkContent() {
		if (this.contentStr == null)
			return;
		String blacklist = (String) Profile.I.blacklist;
		if (blacklist != null && this.contentStr.matches(blacklist))
			throw new RuntimeException(
					"the content includes some restricted words.");
	}

	protected void makeExcerpt() {
		if (this.contentStr == null)
			return;
		this.excerpt = this.contentStr.replaceAll("<[^<>]*>", "");
		if (this.excerpt.length() > 100)
			excerpt = excerpt.substring(0, 100) + "...";
	}

	public void postPersist() {
		post2WB();
	}

	protected void post2WB() {
		if (!this.supportWeibo || this.weiboID != null
				|| Profile.I.weibo.get("token") == null)
			return;
		String message = Profile.I.wbStatus
				.get(this.entityType().toLowerCase());
		if (message == null)
			return;
		try {
			Weibo weibo = new Weibo();
			message = message
					.replaceAll("title1", "#" + this.title + "#")
					.replaceAll("id1", this.ID.toString());
			this.weiboID = weibo.status(message);
			this.resolveAttrs=false;
			ObjectifyService.begin().put(this);
		} catch (Exception e) {
			e.printStackTrace();
		}

	}

	@SuppressWarnings("unchecked")
	protected void collectTagAttr() {
		try {
			if (!resolveAttrs)
				return;
			Set<Long> oldAttrs = attrs;
			attrs = new TreeSet<Long>();
			for (Field field : getClass().getFields()) {
				if (field.isAnnotationPresent(TagAttr.class)) {
					if (Collection.class.isAssignableFrom(field.getType())) {
						Collection<Long> values = (Collection<Long>) field
								.get(this);
						if (values != null)
							attrs.addAll(values);
					} else {
						Long value = (Long) field.get(this);
						if (value != null)
							attrs.add(value);
					}
				}
			}
			List<Tag> tags = new ArrayList<Tag>();
			if (oldAttrs != null && !oldAttrs.isEmpty()) {
				Set<Long> removed = new TreeSet<Long>(oldAttrs);
				if (attrs != null && attrs.isEmpty())
					removed.removeAll(attrs);
				if (!removed.isEmpty()) {
					for (Tag t : (ObjectifyService.begin().get(
							(Class<? extends Tag>) Profile.I.tagger.getClass()
									.getEnclosingClass(), removed).values())) {
						t.dec(this);
						tags.add(t);
					}
				}
			}

			if (!attrs.isEmpty()) {
				Set<Long> added = new TreeSet<Long>(attrs);
				if (oldAttrs != null && oldAttrs.isEmpty())
					added.removeAll(oldAttrs);
				if (!added.isEmpty()) {
					for (Tag t : (ObjectifyService.begin().get(
							(Class<? extends Tag>) Profile.I.tagger.getClass()
									.getEnclosingClass(), added).values())) {
						t.inc(this);
						tags.add(t);
					}
				}
			}

			if (!tags.isEmpty())
				ObjectifyService.begin().put(tags);
		} catch (Exception e) {
			throw new RuntimeException(e.getMessage(), e);
		}
	}

	@Path("post")
	public static class View extends AModel.View {
		@GET
		@Path("create.html")
		@Caps
		@Test
		public Viewable createUI(
				@DefaultValue("0") @QueryParam("parent") long parent)
				throws InstantiationException, IllegalAccessException {
			Post post = (Post) this.newInstance();
			post.parent = parent;
			return viewable(viewDataModel("Create", "postForm", "post", post));
		}

		@GET
		@Path("edit/{ID:(\\d+)}.shtml")
		@Produces(MediaType.TEXT_HTML)
		@Caps
		@Test(value = { ".ID" }, model = EnclosingModel.class)
		public Viewable editUI(@PathParam("ID") long ID) {
			return viewable(viewDataModel("Edit", "postForm", "post",
					this.get(ID)));
		}

		@GET
		@Produces({ MediaType.TEXT_HTML, MediaType.APPLICATION_JSON })
		@Tests({ @Test, @Test(urlExtra = ";o=-generalRating"),
				@Test(urlExtra = ";o=-votes"),
				@Test(urlExtra = ";o=-favorites") })
		public Viewable showList(@Context UriInfo uriInfo) {
			SearchFilter search = this.getListSearchFilter(uriInfo, getClass()
					.getEnclosingClass());
			String title = search.title;
			if (title == null || title.isEmpty())
				title = "Latest";
			return viewable(viewDataModel(title, "showList", "count",
					search.getCount(), "searchFilter", search, "posts",
					search.list()));
		}

		@GET
		@Path("{guid:.*}.shtml")
		@Produces({ MediaType.TEXT_HTML })
		@Test(value = ".guid", model = EnclosingModel.class, removeTester = true)
		public Viewable show(@PathParam("guid") String guid,
				@Context UriInfo uriInfo) {
			Post post = (Post) ObjectifyService.begin()
					.query(getClass().getEnclosingClass()).filter("guid", guid)
					.get();
			return viewable(viewDataModel(post.title, "show1", "post", post));
		}

		@GET
		@Path("show/{ID:(\\d+)}.shtml")
		@Produces({ MediaType.TEXT_HTML })
		@Test(value = { ".ID" }, model = EnclosingModel.class)
		public Viewable show(@PathParam("ID") long ID, @Context UriInfo uriInfo) {
			Post post = (Post) this.get(ID);
			return viewable(viewDataModel(post.title, "show1", "post", post));
		}

		@GET
		@Path("serials")
		@Produces({ MediaType.APPLICATION_JSON })
		@SuppressWarnings("unchecked")
		public List<? extends Post> listSerialPosts() {
			return (List<? extends Post>) ObjectifyService.begin()
					.query(getClass().getEnclosingClass())
					.filter("serial", true).list();
		}

		@GET
		@Path("like/{ID:\\d+}")
		@Produces(MediaType.APPLICATION_JSON)
		@Caps
		@Test(value = ".ID", model = EnclosingModel.class)
		public synchronized int likeit(@PathParam("ID") long ID) {
			Post post = (Post) this.get(ID);
			return doLikeit(post);
		}

		protected int doLikeit(Post post) {
			Objectify store = ObjectifyService.begin();
			Like vote = store.query(Like.class)
					.filter("author", User.getCurrentUserID())
					.filter("entityID", post.ID).get();
			if (vote != null) {
				store.delete(vote);
				post.votes--;
				if (post.votes < 0)
					post.votes = 0;
				store.put(post);
			} else {
				vote = new Like();
				vote.entityID = post.ID;
				vote.entityType = post.entityType();
				post.votes++;
				store.put(vote, post);
			}

			return post.votes;
		}

		@GET
		@Path("favorite/{ID:\\d+}")
		@Produces(MediaType.APPLICATION_JSON)
		@Caps
		@Test(value = ".ID", model = EnclosingModel.class)
		public synchronized int favorite(@PathParam("ID") long ID) {
			Post post = (Post) this.get(ID);
			return doFavorite(post);
		}

		protected int doFavorite(Post post) {
			Objectify store = ObjectifyService.begin();
			Favorite favorite = store.query(Favorite.class)
					.filter("author", User.getCurrentUserID())
					.filter("entityID", post.ID).get();
			if (favorite != null) {
				store.delete(favorite);
				post.favorites--;
				if (post.favorites < 0)
					post.favorites = 0;
				store.put(post);
			} else {
				favorite = new Favorite();
				favorite.entityID = post.ID;
				favorite.entityType = post.entityType();
				post.favorites++;
				store.put(favorite, post);
			}

			return post.favorites;
		}

		@GET
		@Path("my/favorite")
		@Produces(MediaType.TEXT_HTML)
		@Caps
		@Test
		public Viewable myFavorite() {
			Objectify store = ObjectifyService.begin();
			List<Favorite> favorites = store.query(Favorite.class)
					.filter("author", User.getCurrentUserID())
					.filter("entityType", this.newInstance().entityType())
					.order("-ID").list();
			if (favorites.isEmpty())
				return null;
			List<Long> IDs = new ArrayList<Long>();
			for (Favorite favorite : favorites)
				IDs.add(favorite.entityID);
			Collection<Object> posts = store.get(
					this.getClass().getEnclosingClass(), IDs).values();
			return viewable(viewDataModel("", "listTitle", "template",
					"empty_template", "it", posts));
		}

		@GET
		@Path("admin/favorite")
		@Produces(MediaType.TEXT_HTML)
		@Test
		public Viewable adminFavorite() {
			Objectify store = ObjectifyService.begin();
			List<Favorite> favorites = store.query(Favorite.class)
					.filter("author", Profile.I.getAdmin().ID)
					.filter("entityType", this.newInstance().entityType())
					.order("-ID").list();
			List<Long> IDs = new ArrayList<Long>();
			for (Favorite favorite : favorites)
				IDs.add(favorite.entityID);
			List<Object> posts = new ArrayList<Object>(10);
			if (!IDs.isEmpty())
				posts.addAll(store
						.get(this.getClass().getEnclosingClass(), IDs).values());

			return viewable(viewDataModel("", "listTitle", "template",
					"empty_template", "it", posts));
		}

		@GET
		@Path("my/like")
		@Produces(MediaType.TEXT_HTML)
		@Caps
		@Test
		public Viewable myLike() {
			Objectify store = ObjectifyService.begin();
			List<Like> likes = store.query(Like.class)
					.filter("author", User.getCurrentUserID())
					.filter("entityType", this.newInstance().entityType())
					.order("-ID").list();
			if (likes.isEmpty())
				return null;
			List<Long> IDs = new ArrayList<Long>();
			for (Favorite favorite : likes)
				IDs.add(favorite.entityID);
			Collection<Object> posts = store.get(
					this.getClass().getEnclosingClass(), IDs).values();
			return viewable(viewDataModel("", "listTitle", "template",
					"empty_template", "it", posts));
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
				@TestValue(field = "content", value = Runner.TEST_CONTENT) @FormParam("content") String content)
				throws URISyntaxException {
			Objectify store = ObjectifyService.begin();
			Post post = (Post) this.get(store, ID);
			post.parent = parent;
			post.title = title;
			post.setContent(content);
			store.put(post);
			post.postPersist();
			return Response.seeOther(
					new URI("/" + this.path() + "/show/" + post.ID + ".shtml"))
					.build();
		}
	}
}
