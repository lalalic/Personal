package com.yy.app.media;

import java.util.ArrayList;
import java.util.Collection;
import java.util.List;

import com.googlecode.objectify.Objectify;
import com.googlecode.objectify.ObjectifyService;
import com.googlecode.objectify.annotation.Indexed;
import com.googlecode.objectify.annotation.Unindexed;
import com.yy.app.AModel;
import com.yy.app.auth.User;
import com.yy.rs.Uniques;

@Unindexed
@Uniques("author+name")
public class Album extends AModel {
	private final static String ALBUM_MISC = "__misc__";
	@Indexed
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
		return ObjectifyService.begin().get(Resource.class, this.resources).values();
	}

	public static Album getAlbum(long possibleID, String newAlbumName) {
		Objectify store = ObjectifyService.begin();
		Album album = null;

		if (possibleID != 0)
			album=store.get(Album.class, possibleID);
		else
			album=getAlbum(newAlbumName);
		return album;
	}

	public static Album getAlbum(String name) {
		Objectify store = ObjectifyService.begin();
		if (name == null)
			name = ALBUM_MISC;
		Album album = store.query(Album.class)
				.filter("author", User.getCurrentUserID()).filter("name", name)
				.get();
		if (album == null) {
			album = new Album();
			album.name = name;
			store.put(album);
		}

		return album;
	}
	
	public static List<Album> getAlbums(){
		return ObjectifyService.begin().query(Album.class).filter("author", User.getCurrentUserID()).list();
	}

}
