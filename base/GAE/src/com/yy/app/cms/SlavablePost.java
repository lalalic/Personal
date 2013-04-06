package com.yy.app.cms;

import java.net.URI;
import java.net.URISyntaxException;
import java.util.HashMap;
import java.util.List;

import javax.persistence.Transient;
import javax.ws.rs.Consumes;
import javax.ws.rs.FormParam;
import javax.ws.rs.GET;
import javax.ws.rs.POST;
import javax.ws.rs.Path;
import javax.ws.rs.PathParam;
import javax.ws.rs.Produces;
import javax.ws.rs.core.Context;
import javax.ws.rs.core.MediaType;
import javax.ws.rs.core.Response;
import javax.ws.rs.core.UriInfo;

import com.googlecode.objectify.Objectify;
import com.googlecode.objectify.ObjectifyService;
import com.googlecode.objectify.annotation.Index;
import com.sun.jersey.api.view.Viewable;
import com.yy.app.AModel;
import com.yy.app.SearchFilter;
import com.yy.app.test.EnclosingModel;
import com.yy.app.test.PathIs;
import com.yy.app.test.Runner;
import com.yy.app.test.SlaveModel;
import com.yy.app.test.Test;
import com.yy.app.test.TestValue;
import com.yy.app.test.Tests;
import com.yy.rs.Caps;

public abstract class SlavablePost extends Post {
	@Index
	public int slaveCount = 0;

	@Transient
	transient public SearchFilter slaveFilter;
	@Transient
	transient public int filteredSlaveCount = -1;

	public SlavablePost() {
		slaveFilter = new SearchFilter(this.getSlaveClass());
	}

	@SuppressWarnings("rawtypes")
	@Transient
	public List getSlaves() {
		slaveFilter.addFilter("parent", ID);
		this.filteredSlaveCount = slaveFilter.getCount();
		return slaveFilter.list();
	}

	@Transient
	public Class<?> getSlaveClass() {
		return this.getSlaveView().getClass().getEnclosingClass();
	}

	@Transient
	public abstract Post.View getSlaveView();

	@Override
	public AModel tester() throws InstantiationException,
			IllegalAccessException {
		SlavablePost tester = (SlavablePost) super.tester();
		AModel slave = (AModel) this.getSlaveClass().newInstance();
		slave = slave.tester();
		ObjectifyService.ofy().save().entity(slave).now();
		return tester;
	}

	public static class View extends Post.View {

		public Post getSlave(long ID) {
			Post result = null;
			try {
				SlavablePost post = (SlavablePost) (this.getClass()
						.getEnclosingClass().newInstance());
				result = (Post) post.getSlaveView().get(ID);
			} catch (Exception e) {
				e.printStackTrace();
			}
			return result;
		}

		@GET
		@Path("edit/slave/{ID:(\\d+)}.shtml")
		@Produces(MediaType.TEXT_HTML)
		@Caps
		@Test(value = { ".ID" }, model = EnclosingModel.class)
		public Viewable editSlaveUI(@PathParam("ID") long ID) {
			return viewable(viewDataModel("Edit", "slavePostForm", "template",
					"empty_template", "slave", this.getSlave(ID)));
		}

		@Override
		@GET
		@Path("{guid:.*}.shtml")
		@Produces({ MediaType.TEXT_HTML })
		@Tests({
				@Test(value = ".guid", model = EnclosingModel.class),
				@Test(value = ".guid", model = EnclosingModel.class, urlExtra = ";o=-generalRating"),
				@Test(value = ".guid", model = EnclosingModel.class, urlExtra = ";o=-votes"),
				@Test(value = ".guid", model = EnclosingModel.class, urlExtra = ";o=-favorites") })
		public Viewable show(@PathParam("guid") String guid,
				@Context UriInfo uriInfo) {
			Viewable view = super.show(guid, uriInfo);
			@SuppressWarnings("unchecked")
			SlavablePost post = (SlavablePost) ((HashMap<String, Object>) view
					.getModel()).get("post");
			post.slaveFilter = this
					.extractFilter(uriInfo, post.getSlaveClass());
			return view;
		}

		@Override
		@GET
		@Path("show/{ID:(\\d+)}.shtml")
		@Produces({ MediaType.TEXT_HTML })
		@Tests({
				@Test(value = ".ID", model = EnclosingModel.class),
				@Test(value = ".ID", model = EnclosingModel.class, urlExtra = ";o=-generalRating"),
				@Test(value = ".ID", model = EnclosingModel.class, urlExtra = ";o=-votes"),
				@Test(value = ".ID", model = EnclosingModel.class, urlExtra = ";o=-favorites"),
				@Test(IF = @PathIs("zaojiao"), value = ".ID", model = EnclosingModel.class, urlExtra = ";instructor=a"),
				@Test(IF = @PathIs("zaojiao"), value = ".ID", model = EnclosingModel.class, urlExtra = ";classtype=b"),
				@Test(IF = @PathIs("zaojiao"), value = ".ID", model = EnclosingModel.class, urlExtra = ";instructor=a;classtype=b") })
		public Viewable show(@PathParam("ID") long ID, @Context UriInfo uriInfo) {
			Viewable view = super.show(ID, uriInfo);
			@SuppressWarnings("unchecked")
			SlavablePost post = (SlavablePost) ((HashMap<String, Object>) view
					.getModel()).get("post");
			post.slaveFilter = this
					.extractFilter(uriInfo, post.getSlaveClass());
			return view;
		}

		@POST
		@Path("slave/post/{ID:\\d+}")
		@Consumes(MediaType.APPLICATION_FORM_URLENCODED)
		@Produces(MediaType.APPLICATION_JSON)
		@Caps
		@Test(value = ".ID", model = SlaveModel.class)
		public boolean updateSlaveContent(
				@PathParam("ID") long ID,
				@TestValue(field = "content", value = Runner.TEST_CONTENT) @FormParam("content") String content) {
			assert ID > 0;
			Objectify store = ObjectifyService.ofy();
			Post slave = this.getSlave(ID);
			slave.setContent(content);
			store.save().entity(slave).now();
			slave.postPersist();
			return true;
		}

		@GET
		@Path("slave/like/{ID:\\d+}")
		@Produces(MediaType.APPLICATION_JSON)
		@Caps
		@Test(value = ".ID", model = SlaveModel.class)
		public synchronized int likeitSlave(@PathParam("ID") long ID) {
			Post post = (Post) this.getSlave(ID);
			return super.doLikeit(post);
		}

		@GET
		@Path("slave/favorite/{ID:\\d+}")
		@Produces(MediaType.APPLICATION_JSON)
		@Caps
		@Test(value = ".ID", model = SlaveModel.class)
		public synchronized int favoriteSlave(@PathParam("ID") long ID) {
			Post post = (Post) this.getSlave(ID);
			return super.doFavorite(post);
		}

		@GET 
		@Path("slaves")
		@Produces({ MediaType.TEXT_HTML })
		public Viewable showSlaveList(@Context UriInfo uriInfo) {
			Class<?> slaveClass = ((SlavablePost) this.newInstance())
				.getSlaveClass();
			SearchFilter search = this.getListSearchFilter(uriInfo,slaveClass);
			String title=search.title;
			if(title==null || title.isEmpty())
				title="Latest";
			return viewable(viewDataModel(title, "slaves", "count",
					search.getCount(),
					"searchFilter", search, 
					"slaves",search.list()));
		}

		protected Response slavePostResponse(boolean isNew, Slave slave)
				throws URISyntaxException {
			if (isNew)
				return Response.seeOther(
						new URI("/" + this.path() + "/show/" + slave.parent
								+ ".shtml#" + slave.ID)).build();
			else
				return Response.ok(
						viewable(viewDataModel("", "show1Slave", "slave",
								slave, "template", "empty_template"))).build();
		}
	}
}
