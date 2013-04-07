package com.yy.app.cms;

import com.googlecode.objectify.annotation.Entity;
import com.googlecode.objectify.annotation.Id;
import com.googlecode.objectify.annotation.OnSave;
import com.yy.app.auth.User;

@Entity
public class Favorite{
	@Id 
	public Long ID;
	public long author;
	public long entityID;
	public String entityType;
	
	@OnSave
	protected void prePost(){
		author=User.getCurrentUserID();
	}
}
