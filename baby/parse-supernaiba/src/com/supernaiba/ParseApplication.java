package com.supernaiba;

import greendroid.app.GDApplication;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.IntentFilter;
import android.net.ConnectivityManager;
import android.net.NetworkInfo;

import com.parse.Parse;
import com.parse.ParseACL;
import com.parse.ParseAnonymousUtils;
import com.parse.ParseException;
import com.parse.ParseUser;
import com.supernaiba.parse.Query;

public class ParseApplication extends GDApplication {

	@Override
	public void onCreate() {
		super.onCreate();
		
		registerNetworkListener();
		
		// Add your initialization code here
		Parse.initialize(this, "CxZhTKQklDOhDasWX9hidldoK7xtzEmtcl5VSBeL", "P7pgF26TZXb5blBILO6M1D4ooCKmHJAE03artssu");


		ParseUser.enableAutomaticUser();
		ParseACL defaultACL = new ParseACL();
	    
		// If you would like all objects to be private by default, remove this line.
		defaultACL.setPublicReadAccess(true);
		
		ParseACL.setDefaultACL(defaultACL, true);
		
		ParseUser user=ParseUser.getCurrentUser();
		if(!ParseAnonymousUtils.isLinked(user) 
				&& user.getObjectId()==null)
			try {
				user.save();
			} catch (ParseException e) {
				
			}
	}
	
	protected void registerNetworkListener(){
		BroadcastReceiver networkStateReceiver = new BroadcastReceiver() {

		    @Override
		    public void onReceive(Context context, Intent intent) {
		    	 if(intent.getExtras()!=null) {
	    	        NetworkInfo ni=(NetworkInfo) intent.getExtras().get(ConnectivityManager.EXTRA_NETWORK_INFO);
	    	        if(ni!=null && ni.getState()==NetworkInfo.State.CONNECTED) {
	    	            Query.IS_ONLINE=true;
	    	        }
	    	     }
	    	     if(intent.getExtras().getBoolean(ConnectivityManager.EXTRA_NO_CONNECTIVITY,Boolean.FALSE)) {
	    	    	 Query.IS_ONLINE=true;
	    	     }
		    }
		};

		IntentFilter filter = new IntentFilter(ConnectivityManager.CONNECTIVITY_ACTION);        
		registerReceiver(networkStateReceiver, filter);
	}

}
