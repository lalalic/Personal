package com.minicheers.app.account;

import java.util.Calendar;
import java.util.Date;

import com.googlecode.objectify.annotation.Indexed;
import com.googlecode.objectify.annotation.Unindexed;
import com.yy.app.AModel;

@Unindexed
public class Child extends AModel {
	public String nick;
	@Indexed
	public Date birthday;
	public String gender;
	
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
