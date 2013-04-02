package com.equ.service;


import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.net.NetworkInfo;
import android.net.wifi.WifiManager;
import android.util.Log;

import com.equ.R;

public class UploadTrigger extends BroadcastReceiver{
	@Override
	public void onReceive(Context ctx, Intent intent) {
		NetworkInfo info = intent
				.getParcelableExtra(WifiManager.EXTRA_NETWORK_INFO);
		switch (info.getState()) {
		case CONNECTED:
			if(UpdateService.service!=null){
				UpdateService.getLocationService().updatable(true);
				UpdateService.getPhotoService().updatable(true);
				Log.d(ctx.getString(R.string.app_name), "Network conntected");
			}
			break;
		case CONNECTING:
			break;
		default:
			if(UpdateService.service!=null){
				UpdateService.getLocationService().updatable(false);
				UpdateService.getPhotoService().updatable(false);
				Log.d(ctx.getString(R.string.app_name), "Network disconntected");
			}
		}
	}

}
