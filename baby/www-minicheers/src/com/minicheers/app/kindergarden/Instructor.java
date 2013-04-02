package com.minicheers.app.kindergarden;

import com.googlecode.objectify.annotation.Unindexed;
import com.yy.app.AModel;
import com.yy.rs.Uniques;

@Uniques({ "parent+name" })
@Unindexed
public class Instructor extends AModel {
	public String name;
	public int gender;
	
}
