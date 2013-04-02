package com.yy.app.tag;

import java.lang.reflect.Field;
import java.util.ArrayList;
import java.util.Collection;
import java.util.List;
import java.util.Map;

import javax.persistence.PrePersist;
import javax.persistence.Transient;
import javax.ws.rs.FormParam;
import javax.ws.rs.GET;
import javax.ws.rs.POST;
import javax.ws.rs.Path;
import javax.ws.rs.Produces;
import javax.ws.rs.core.MediaType;

import com.googlecode.objectify.Objectify;
import com.googlecode.objectify.ObjectifyService;
import com.googlecode.objectify.annotation.Indexed;
import com.googlecode.objectify.annotation.Unindexed;
import com.sun.jersey.api.view.Viewable;
import com.yy.app.AModel;
import com.yy.rs.AdminUI;
import com.yy.rs.Caps;
import com.yy.rs.Uniques;

@Uniques({ "name" })
@Unindexed
public class Tag extends AModel {
	@Indexed
	public String name;

	public long count = 0;

	public List<Long> included = new ArrayList<Long>();

	@Transient
	public String includedStr;

	@PrePersist
	protected void saveChildren() {
		if (includedStr == null || includedStr.length() == 0)
			return;
		List<Tag> tags = new View().create(null, includedStr);
		if (tags != null && tags.size() > 0) {
			this.included = new ArrayList<Long>();
			for (Tag tag : tags)
				this.included.add(tag.ID);
		}
	}
	
	

	@Path("tag")
	public static class View extends AModel.View {

		@GET
		@Path("admin.html")
		@AdminUI({ "Resource", "Tag" })
		@Caps("Tag Management")
		public Viewable adminUI() {
			return viewable(viewDataModel(
					"Taxonomy Management",
					"tag",
					"tags",
					ObjectifyService.begin()
							.query(getClass().getEnclosingClass()).list()));
		}

		@POST
		@Path("create")
		@Produces(MediaType.APPLICATION_JSON)
		@Caps("Tag Management")
		public List<Tag> create(@FormParam("parentTag") String parentTag,
				@FormParam("tags") String tags) {
			Objectify store = ObjectifyService.begin();
			Tag parent = null;
			if (parentTag != null && parentTag.length() > 0) {
				parent = (Tag) store.query(this.getClass().getEnclosingClass())
						.filter("name", parentTag).get();
				if (parent == null) {
					parent = (Tag) newInstance();
					parent.name = parentTag;
				}
			}

			String[] terms = tags.split(",");
			List<Tag> newTags = new ArrayList<Tag>();
			List<Tag> allTags = new ArrayList<Tag>();
			for (String term : terms) {
				if (term.length() < 1)
					continue;
				Tag tag = (Tag) store
						.query(this.getClass().getEnclosingClass())
						.filter("name", term).get();
				if (tag == null) {
					tag = (Tag) newInstance();
					tag.name = term;
					newTags.add(tag);
				}
				allTags.add(tag);
			}

			if (newTags.size() > 0)
				store.put(newTags);

			if (parent != null) {
				parent.included = new ArrayList<Long>();
				for (Tag tag : allTags)
					parent.included.add(tag.ID);

				if (parent.ID == null || parent.ID == 0)
					allTags.add(0, parent);

				store.put(parent);
			}

			return allTags;
		}

		public Tag get(String name) {
			Objectify store = ObjectifyService.begin();
			Tag tag = (Tag) store.query(this.getClass().getEnclosingClass())
					.filter("name", name).get();
			if (tag == null) {
				tag = (Tag) newInstance();
				tag.name = name;
				store.put(tag);
			}
			return tag;
		}

		public List<Long> parseList(String pendings, String cat) {
			if (pendings == null || pendings.isEmpty())
				return null;
			List<Tag> tags = create(null, pendings);
			Tag category = get(cat);
			for (Tag tag : tags)
				if(!category.included.contains(tag.ID))
					category.included.add(tag.ID);
			ObjectifyService.begin().put(category);
			return category.included;
		}

		public long parse(String key, String cat) {
			if (key == null || key.isEmpty())
				return 0l;
			try {
				return Long.parseLong(key);
			} catch (NumberFormatException e) {
				Tag category = get(cat);
				Tag t = get(key);
				if(!category.included.contains(t.ID)){
					category.included.add(t.ID);
					ObjectifyService.begin().put(category);
				}
				return t.ID;
			}
		}

		@SuppressWarnings("unchecked")
		public Collection<Tag> list(String cat) {
			Tag category = get(cat);
			return ObjectifyService
					.begin()
					.get((Class<? extends Tag>) getClass().getEnclosingClass(),
							category.included).values();
		}

		public String listName(List<Long> ids) {
			if (ids == null || ids.isEmpty())
				return "";
			if(ids.size()==1){
				if(ids.get(0)>0){
					Tag t= ((Tag)get(ids.get(0)));
					return t.name;
				}else
					return "";
			}
			@SuppressWarnings("unchecked")
			Collection<Tag> tags = ObjectifyService
					.begin()
					.get((Class<? extends Tag>) getClass().getEnclosingClass(),
							ids).values();

			StringBuilder names = new StringBuilder();
			for (Tag t : tags)
				names.append(",").append(t.name);
			return names.substring(1);
		}
		public String listName(Long id){
			if(id==null || id<=0)
				return "";
			return ((Tag)get(id)).name;
		}

		/**
		 * init data from conf.xml
		 * 
		 * @param data
		 */
		public void setInitData(Map<String, List<String>> data) {
			Objectify store = ObjectifyService.begin();
			List<Tag> tags = new ArrayList<Tag>();
			Tag cat, tag;
			for (String key : data.keySet()) {
				for (String aTag : data.get(key)) {
					tag = get(aTag);
					tags.add(tag);
				}
				cat = get(key);
				for (Tag t : store.put(tags).values())
					if (!cat.included.contains(t.ID))
						cat.included.add(t.ID);
				store.put(cat);
				tags.clear();
				cat = null;
			}
		}
		//YamlBean need this empty get function
		public Map<String, List<String>> getInitData() {
			return null;
		}
	}

	public void dec(AModel a) {
		try {
			Field f=this.getClass().getField(a.entityType().toLowerCase());
			int value=(Integer)f.get(this);
			if(value>0)
				f.set(this, value-1);
		} catch (Exception e) {
			
		} 
	}

	public void inc(AModel a) {
		try {
			Field f=this.getClass().getField(a.entityType().toLowerCase());
			int value=(Integer)f.get(this);
			if(value>0)
				f.set(this, value+1);
		} catch (Exception e) {
			
		}
	}
}
