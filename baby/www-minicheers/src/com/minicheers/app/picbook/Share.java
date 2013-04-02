package com.minicheers.app.picbook;

import java.util.List;

import javax.persistence.Transient;

import com.googlecode.objectify.annotation.Entity;
import com.googlecode.objectify.annotation.Unindexed;
import com.yy.app.cms.Post;
import com.yy.app.cms.Slave;
import com.yy.rs.TagAttr;

@Entity(name = "Book_Share")
@Unindexed
public class Share extends Slave{
	@Transient @TagAttr("Book.suitableAge")
	public List<Long> suitableAge;
	public String tool;

	public static class View extends Post.View{
		
	}
}