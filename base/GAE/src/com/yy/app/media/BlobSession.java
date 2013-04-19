package com.yy.app.media;

import com.googlecode.objectify.annotation.Entity;
import com.googlecode.objectify.annotation.Id;

@Entity(name="__BlobInfo__")
public class BlobSession {
	@Id
	public String ID;
}
