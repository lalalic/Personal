package com.supernaiba.app.account;

import java.util.Calendar;
import java.util.Date;

import com.googlecode.objectify.annotation.Entity;
import com.googlecode.objectify.annotation.Index;
import com.yy.app.AModel;
import com.yy.rs.TagAttr;

@Entity
public class Child extends AModel {
	public String nick;
	@Index
	public Date birthday;
	
	@TagAttr
	public long gender;
	
	@SuppressWarnings("deprecation")
	public int getMonthes() {
		if(birthday==null)
			return 0;
		Calendar cal=Calendar.getInstance();
		Date now=cal.getTime();
	    int m1 = birthday.getYear() * 12 + birthday.getMonth();
	    int m2 = now.getYear() * 12 + now.getMonth();
	    return m2 - m1 + 1;
	}
}
