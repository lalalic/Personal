package com.supernaiba;

import greendroid.app.GDApplication;

import com.parse.Parse;
import com.parse.ParseACL;
import com.parse.ParseAnonymousUtils;
import com.parse.ParseException;
import com.parse.ParseUser;

public class ParseApplication extends GDApplication {

	@Override
	public void onCreate() {
		super.onCreate();

		// Add your initialization code here
		Parse.initialize(this, "CxZhTKQklDOhDasWX9hidldoK7xtzEmtcl5VSBeL", "P7pgF26TZXb5blBILO6M1D4ooCKmHJAE03artssu");


		ParseUser.enableAutomaticUser();
		ParseACL defaultACL = new ParseACL();
	    
		// If you would like all objects to be private by default, remove this line.
		defaultACL.setPublicReadAccess(true);
		
		ParseACL.setDefaultACL(defaultACL, true);
		
		ParseUser user=ParseUser.getCurrentUser();
		if(!ParseAnonymousUtils.isLinked(user) && user.getObjectId()==null)
			try {
				user.save();
			} catch (ParseException e) {
				
			}
	}

}
