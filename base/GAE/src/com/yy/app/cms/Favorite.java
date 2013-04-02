package com.yy.app.cms;

import javax.persistence.Id;
import javax.persistence.PrePersist;

import com.yy.app.auth.User;

public class Favorite{
	@Id 
	public Long ID;
	public long author;
	public long entityID;
	public String entityType;
	
	@PrePersist
	protected void prePost(){
		author=User.getCurrentUserID();
	}
}
