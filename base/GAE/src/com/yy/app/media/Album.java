package com.yy.app.media;

import java.util.ArrayList;
import java.util.Collection;
import java.util.List;

import com.googlecode.objectify.Objectify;
import com.googlecode.objectify.ObjectifyService;
import com.googlecode.objectify.annotation.Index;
import com.googlecode.objectify.annotation.Unindex;
import com.yy.app.AModel;
import com.yy.app.auth.User;
import com.yy.rs.Uniques;

@Unindex
@Uniques("author+name")
public class Album extends AModel {
	private final static String ALBUM_MISC = "__misc__";
	@Index
	public String name;
	private List<String> resources;
	

	public void addResource(String resource) {
		if (this.resources == null)
			this.resources = new ArrayList<String>();
		this.resources.add(resource);
	}

	public Collection<Resource> getResources() {
		if (this.resources == null)
			return new ArrayList<Resource>();
		return ObjectifyService.ofy().load().type(Resource.class).ids(this.resources).values();
	}

	public static Album getAlbum(long possibleID, String newAlbumName) {
		Objectify store = ObjectifyService.ofy();
		Album album = null;

		if (possibleID != 0)
			album=store.load().type(Album.class).id(possibleID).get();
		else
			album=getAlbum(newAlbumName);
		return album;
	}

	public static Album getAlbum(String name) {
		Objectify store = ObjectifyService.ofy();
		if (name == null)
			name = ALBUM_MISC;
		Album album = store.load().type(Album.class)
				.filter("author", User.getCurrentUserID()).filter("name", name)
				.first().get();
		if (album == null) {
			album = new Album();
			album.name = name;
			store.save().entity(album).now();
		}

		return album;
	}
	
	public static List<Album> getAlbums(){
		return ObjectifyService.ofy().load().type(Album.class).filter("author", User.getCurrentUserID()).list();
	}

}
