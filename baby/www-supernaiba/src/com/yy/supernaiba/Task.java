package com.yy.supernaiba;

import java.util.Date;
import java.util.List;

import com.googlecode.objectify.Ref;
import com.googlecode.objectify.annotation.Entity;
import com.googlecode.objectify.annotation.Index;
import com.yy.app.AModel;
import com.yy.rs.TagAttr;

@Entity
public class Task extends AModel {
	@Index
	public Date eventDay;
	
	public int hours;
	
	@TagAttr
	public int category;
	
	public List<Ref<Categorized>> items;
	
	public static class View extends AModel.View{
		public void create(){
			
		}
	}
}
