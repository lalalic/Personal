package com.minicheers.app.game;

import java.util.Set;

import com.googlecode.objectify.annotation.Entity;
import com.googlecode.objectify.annotation.Indexed;
import com.yy.app.cms.Post;
import com.yy.app.cms.Slave;

@Entity(name="Game_Share")
public class Share extends Slave {
	
	@Indexed public Set<String> suitableAge;
	public String tools;
	
	public static class View extends Post.View{
		
	}

	@Override
	public Post getMaster() {
		// TODO Auto-generated method stub
		return null;
	}
}
