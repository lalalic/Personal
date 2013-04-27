package com.supernaiba.app.game;

import java.util.Set;

import com.googlecode.objectify.annotation.Entity;
import com.googlecode.objectify.annotation.Index;
import com.yy.app.cms.Post;
import com.yy.app.cms.Slave;

@Entity(name="Game_Share")
public class Share extends Slave {
	
	@Index public Set<String> suitableAge;
	public String tools;
	
	public static class View extends Post.View{
		
	}
}
