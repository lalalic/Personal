package com.yy.supernaiba.game;

import javax.ws.rs.Path;

import com.googlecode.objectify.annotation.EntitySubclass;
import com.yy.supernaiba.Categorized;

@EntitySubclass
public class Game extends Categorized {
	private String CATEGORY="游戏";
	
	protected String getCategoryName(){
		return CATEGORY;
	}
	
	@Path("game")
	public static class View extends Categorized.View{
		
	}
}
