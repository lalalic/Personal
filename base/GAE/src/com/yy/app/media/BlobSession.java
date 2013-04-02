package com.yy.app.media;

import javax.persistence.Id;

import com.googlecode.objectify.annotation.Entity;

@Entity(name="__BlobInfo__")
public class BlobSession {
	@Id
	public String ID;
}
