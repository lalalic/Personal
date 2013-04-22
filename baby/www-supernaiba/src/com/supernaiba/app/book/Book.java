package com.supernaiba.app.book;

import java.net.URI;
import java.net.URISyntaxException;
import java.util.List;

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
import com.googlecode.objectify.annotation.Ignore;
import com.googlecode.objectify.annotation.Index;
import com.supernaiba.app.Categorized;
import com.yy.app.cms.Post;
import com.yy.app.site.Profile;
import com.yy.app.test.EnclosingModel;
import com.yy.app.test.Runner;
import com.yy.app.test.Test;
import com.yy.app.test.TestValue;
import com.yy.app.test.TestValues;
import com.yy.app.test.Tests;
import com.yy.rs.Caps;
import com.yy.rs.TagAttr;

@EntitySubclass(index=true)
public class Book extends Categorized {
	@Index
	public String alias;

	@Ignore
	@TagAttr
	public List<Long> writer;
	@Ignore
	@TagAttr
	public Long language;
	@Ignore
	@TagAttr
	public List<Long> translator;

	@Ignore
	@TagAttr
	public Long publisher;
	@Ignore
	@TagAttr
	public List<Long> type;
	@Ignore
	@TagAttr
	public List<Long> theme;
	
	public Book(){
		this.supportWeibo=true;
	}

	@Override
	public Post.View getSlaveView() {
		return new Share.View();
	}

	@Path("huiben")
	public static class View extends Categorized.View {

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
				@TestValue(field = "title", value = Runner.TEST_TITLE) @FormParam("title") String title,
				@FormParam("alias") String alias,
				@FormParam("writer") String writer,
				@FormParam("translator") String translator,
				@FormParam("language") long language,
				@FormParam("publisher") String publisher,
				@FormParam("type") List<Long> type,
				@FormParam("theme") List<Long> theme) throws URISyntaxException {
			Objectify store = ObjectifyService.ofy();
			Book book = (Book) this.get(store, ID);
			String typeName = book.entityType();
			book.title = title;
			book.alias = alias;
			book.writer = Profile.I.tagger.parseList(writer, typeName
					+ ".writer");
			book.translator = Profile.I.tagger.parseList(translator, typeName
					+ ".translator");
			book.language = language;
			book.publisher = Profile.I.tagger.parse(publisher, typeName
					+ ".publisher");
			book.type = type;
			book.theme = theme;
			book.resolveAttrs=true;
			store.save().entity(book).now();
			book.postPersist();
			return Response.seeOther(
					new URI("/" + this.path() + "/show/" + book.ID + ".shtml"))
					.build();
		}

		@POST
		@Path("slave/post")
		@Consumes(MediaType.APPLICATION_FORM_URLENCODED)
		@Produces(MediaType.TEXT_HTML)
		@Caps
		@Tests({ @Test(note = "create"), @Test(note = "edit") })
		public Response save(
				@TestValues({
						@TestValue,
						@TestValue(field = "ID", value = ".ID", model = Share.class) }) @DefaultValue("0") @FormParam("ID") long ID,

				@TestValue(field = "parent", value = ".ID", model = EnclosingModel.class) @DefaultValue("0") @FormParam("parent") long parent,

				@TestValue(field = "title", value = Runner.TEST_TITLE) @FormParam("title") String title,
				@TestValue(field = "content", value = Runner.TEST_CONTENT) @FormParam("content") String content,
				@FormParam("tool") String tool,
				@FormParam("suitableAge") List<Long> suitableAge,
				@FormParam("generalRating") int generalRating)
				throws URISyntaxException {
			assert parent > 0;
			Objectify store = ObjectifyService.ofy();
			Share post = (Share) new Share.View().get(store, ID);
			post.parent = parent;
			post.setContent(content);
			post.title = title;
			post.tool = tool;
			post.suitableAge = suitableAge;
			Book book = (Book) get(parent);
			synchronized (getClass()) {
				if (ID == 0) {
					book.ratingCount++;
					book.slaveCount++;
				}
				book.generalRatingSum += (generalRating - post.generalRating);
				book.generalRating = book.generalRatingSum / book.ratingCount;
			}
			post.generalRating = generalRating;
			post.resolveAttrs=true;
			store.save().entities(post, book).now();
			post.postPersist();
			return slavePostResponse(ID==0,post);
		}
	}
}
