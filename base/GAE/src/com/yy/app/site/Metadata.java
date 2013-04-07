package com.yy.app.site;

import java.util.List;

import javax.ws.rs.FormParam;
import javax.ws.rs.GET;
import javax.ws.rs.POST;
import javax.ws.rs.Path;
import javax.ws.rs.Produces;
import javax.ws.rs.core.MediaType;

import com.googlecode.objectify.Objectify;
import com.googlecode.objectify.ObjectifyService;
import com.googlecode.objectify.annotation.Entity;
import com.googlecode.objectify.annotation.Index;

import com.sun.jersey.api.view.Viewable;
import com.yy.app.AModel;
import com.yy.app.test.Test;
import com.yy.app.test.TestValue;
import com.yy.app.test.TestValues;
import com.yy.app.test.Tests;
import com.yy.rs.AdminUI;
import com.yy.rs.Caps;
import com.yy.rs.Required;
import com.yy.rs.Uniques;

@Uniques({ "category+key" })
@Required({"category","key","value"})
@Entity
public class Metadata extends AModel {
	@Index
	public String category;
	@Index
	public String key;
	public String value;

	public String getName() {
		if (category != null || category.length() != 0)
			return category + ":" + key;
		return key;
	}

	@Path("meta")
	
	public static class View extends AModel.View {
		@Override
		public List<Metadata> list(String category) {
			return ObjectifyService.ofy().load().type(Metadata.class)
					.filter("categroy", category).list();
		}

		@POST
		@Path("admin.html")
		@Produces({ MediaType.TEXT_HTML })
		@Caps("Site Configuration")
		@Tests({ @Test, @Test })
		public Viewable save(
				@TestValues({
						@TestValue,
						@TestValue(field = "ID", value = ".ID", model = Metadata.class) }) 
				@FormParam("ID") long ID,

				@TestValue(field = "category", value = "test") 
				@FormParam("category") String category,

				@TestValue(field = "key", value = "test") 
				@FormParam("key") String key,

				@TestValue(field = "value", value = "test") 
				@FormParam("value") String value) {
			Objectify store = ObjectifyService.ofy();
			Metadata meta = (Metadata) this.get(store, ID);
			meta.category = category;
			meta.key = key;
			meta.value = value;
			store.save().entity(meta).now();
			return viewable(viewDataModel("Metadata Management", "metadata",
					"this", this));
		}

		@GET
		@Path("admin.html")
		@Produces(MediaType.TEXT_HTML)
		@Caps("Site Configuration")
		@AdminUI({ "Configuration", "Site" })
		@Test
		public Viewable adminUI() {
			return viewable(viewDataModel("Metadata Management", "metadata",
					"this", this));
		}
	}
}
