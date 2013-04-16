package com.supernaiba.app.book;

import java.util.List;

import com.googlecode.objectify.annotation.Entity;
import com.googlecode.objectify.annotation.Ignore;
import com.yy.app.cms.Post;
import com.yy.app.cms.Slave;
import com.yy.rs.TagAttr;

@Entity(name = "Book_Share")
public class Share extends Slave{
	@Ignore @TagAttr("Book.suitableAge")
	public List<Long> suitableAge;
	public String tool;

	public static class View extends Post.View{
		
	}
}