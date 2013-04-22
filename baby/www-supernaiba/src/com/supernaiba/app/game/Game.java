package com.supernaiba.app.game;

import java.util.Set;

import javax.ws.rs.Path;

import com.googlecode.objectify.annotation.EntitySubclass;
import com.googlecode.objectify.annotation.Index;
import com.supernaiba.app.Categorized;
import com.yy.app.cms.Post;

@EntitySubclass(index=true)
public class Game extends Categorized {
	
	@Index public Set<String> types;
	@Index public Integer fromType=0;
	public String from;
	public Set<String> goal;
	
	public Game(){
		this.ratable=false;
	}
	
	@Override
	public Post.View getSlaveView() {
		return new Share.View();
	}
	
	@Path("youxi")
	public static class View extends Categorized.View{		
		
	}
}
