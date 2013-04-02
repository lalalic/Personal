package com.minicheers.app.kindergarden;

import java.util.Date;

import javax.persistence.Transient;

import com.googlecode.objectify.ObjectifyService;
import com.googlecode.objectify.annotation.Entity;
import com.googlecode.objectify.annotation.Indexed;
import com.googlecode.objectify.annotation.Unindexed;
import com.minicheers.app.account.Child;
import com.yy.app.cms.Post;
import com.yy.app.cms.Slave;

@Entity(name = "KinderGarden_Share")
@Unindexed
public class Share extends Slave {
	@Indexed 
	public String instructor;
	@Indexed 
	public String classType;
	@Indexed 
	public Integer ageMonthes;
	public Long child;
	public Date coursetime;
	
	public int affinityRating;
	public int attractiveRating;
	public int expressiveRating;
	public int bridingRating;
	public int chineseRating;
	public int englishRating;
	@Transient private Child student;
	
	
	/** rating items */
	public Share(){
		this.supportWeibo=true;
	}
	
	public Child getStudent(){
		if(student!=null)
			return student;
		if(child!=null && child>0)
			return (student=ObjectifyService.begin().get(Child.class,child));
		return null;
	}
	
	public static class View extends Post.View{
		
	}
}