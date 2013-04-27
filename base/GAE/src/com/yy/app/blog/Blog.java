package com.yy.app.blog;

import javax.ws.rs.DefaultValue;
import javax.ws.rs.FormParam;
import javax.ws.rs.GET;
import javax.ws.rs.POST;
import javax.ws.rs.Path;
import javax.ws.rs.Produces;
import javax.ws.rs.core.MediaType;

import com.googlecode.objectify.Objectify;
import com.googlecode.objectify.ObjectifyService;
import com.sun.jersey.api.view.Viewable;
import com.yy.app.auth.Role;
import com.yy.app.auth.User;
import com.yy.app.cms.Post;
import com.yy.rs.AdminUI;
import com.yy.rs.Caps;
import com.yy.rs.Required;

@Required({"title","content"})
public class Blog extends Post {
	
	@Path("blog")
	public static class View extends Post.View{
		@POST
		@Path("post")
		@Produces({ MediaType.APPLICATION_JSON })
		public Post save(
				@FormParam("ID") @DefaultValue("0") long ID,
				@FormParam("title") String title,
				@FormParam("content") String content,
				@FormParam("excerpt") String excerpt,
				@FormParam("tags") String tags,
				@FormParam("name") String name,
				@FormParam("guid") String guid,
				@FormParam("comment") @DefaultValue("false") boolean allowComment,
				@FormParam("ping") @DefaultValue("false") boolean allowPing,
				@FormParam("serial") @DefaultValue("false") boolean serial,
				@FormParam("parent") @DefaultValue("0") long parent,
				@FormParam("statusx") @DefaultValue("0") int status) {
			Objectify store = ObjectifyService.ofy();
			Post post = null;
			if (ID == 0) {
				Role.requestCapabilities("Create Post");
				post = (Post) this.newInstance();
			} else {
				post = (Post) store.load()
						.type(this.getClass().getEnclosingClass()).id(ID).get();
				if (post.author != User.getCurrentUserID())
					Role.requestCapabilities("Change Other's Post");
			}
			if (status != 0)
				post.status = status;

			if (STATUS_PUBLISH == post.status)
				Role.requestCapabilities("Publish Post");

			post.title = parse(title);
			post.setContent(parse(content));
			post.excerpt = parse(excerpt);
			post.guid = parse(guid);

			post.allowComment = allowComment;
			post.serial = serial ? serial : null;

			post.setParent(parent);
			return post;
		}

		@POST
		@Path("publish")
		@Produces({ MediaType.APPLICATION_JSON, MediaType.APPLICATION_XML })
		public Post publish(@FormParam("ID") long ID,
				@FormParam("title") String title,
				@FormParam("content") String content,
				@FormParam("excerpt") String excerpt,
				@FormParam("tags") String tags, @FormParam("name") String name,
				@FormParam("guid") String guid,
				@FormParam("commentStatus") boolean allowComment,
				@FormParam("pingStatus") boolean allowPing,
				@FormParam("serial") @DefaultValue("false") boolean serial,
				@FormParam("parent") @DefaultValue("0") long parent) {
			return save(ID, title, content, excerpt, tags, name, guid,
					allowComment, allowPing, serial, parent, STATUS_PUBLISH);
		}

		@POST
		@Path("draft")
		@Produces({ MediaType.APPLICATION_JSON, MediaType.APPLICATION_XML })
		public Post draft(@FormParam("ID") long ID,
				@FormParam("title") String title,
				@FormParam("content") String content,
				@FormParam("excerpt") String excerpt,
				@FormParam("tags") String tags, @FormParam("name") String name,
				@FormParam("guid") String guid,
				@FormParam("commentStatus") boolean allowComment,
				@FormParam("pingStatus") boolean allowPing,
				@FormParam("serial") @DefaultValue("false") boolean serial,
				@FormParam("parent") @DefaultValue("0") long parent) {
			return save(ID, title, content, excerpt, tags, name, guid,
					allowComment, allowPing, serial, parent, STATUS_DRAFT);
		}

		@GET
		@Path("admin.html")
		@Produces({ MediaType.TEXT_HTML })
		@Caps({ "Create Post", "Change Other's Post", "Publish Post" })
		@AdminUI({ "Content", AdminUI.RESOURCE_PATH })
		public Viewable adminUI() {
			return viewable(viewDataModel(this.path() + " Management",
					this.path()));
		}
	}
}
