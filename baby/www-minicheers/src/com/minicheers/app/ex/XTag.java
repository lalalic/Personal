package com.minicheers.app.ex;

import javax.ws.rs.Path;

import com.googlecode.objectify.annotation.Cached;
import com.googlecode.objectify.annotation.Indexed;
import com.googlecode.objectify.annotation.Unindexed;
import com.yy.app.tag.Tag;
import com.yy.rs.Uniques;

@Unindexed
@Uniques({ "name" })
@Cached
public class XTag extends Tag {
	@Indexed public int book;
	@Path("tag")
	public static class View extends Tag.View{
		
	}
}
