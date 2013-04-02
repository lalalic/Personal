package com.minicheers.app.kindergarden;

import com.googlecode.objectify.annotation.Indexed;
import com.googlecode.objectify.annotation.Unindexed;
import com.yy.app.AModel;

@Unindexed
public class ClassType extends AModel {
	@Indexed
	public String name;
}
