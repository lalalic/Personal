package com.equ.service;



import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;

public class ServiceTrigger extends BroadcastReceiver {

	@Override
	public void onReceive(Context ctx, Intent intent) {
		UpdateService.start(ctx);
	}

}
