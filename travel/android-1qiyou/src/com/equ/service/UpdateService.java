package com.equ.service;

import android.app.Service;
import android.content.Context;
import android.content.Intent;
import android.os.Binder;
import android.os.IBinder;
import android.provider.MediaStore;
import android.telephony.CellLocation;
import android.telephony.PhoneStateListener;
import android.telephony.TelephonyManager;

import com.equ.lbs.LocationUpdater;
import com.equ.photo.PhotoUpdater;
import com.yy.m.service.AService;

public class UpdateService extends AService {
	public static UpdateService service;

	public class LocalBinder extends Binder {
		UpdateService getService() {
			return UpdateService.this;
		}
	}

	private final IBinder mBinder = new LocalBinder();

	private LocationUpdater lUpdater;
	private PhotoUpdater pUpdater;
	private PhotoObserver observer;

	@Override
	public IBinder onBind(Intent intent) {
		return mBinder;
	}

	public static Updater getLocationService() {
		return service.lUpdater;
	}

	public static PhotoUpdater getPhotoService() {
		return service.pUpdater;
	}

	@Override
	public void onCreate() {
		super.onCreate();
		service = this;
		lUpdater = new LocationUpdater(this);
		pUpdater = new PhotoUpdater(this);

		TelephonyManager tel = (TelephonyManager) this
				.getSystemService(TELEPHONY_SERVICE);

		lUpdater.add(tel.getCellLocation());

		tel.listen(new PhoneStateListener() {
			@Override
			public void onCellLocationChanged(CellLocation location) {
				lUpdater.add(location);
			}
		}, PhoneStateListener.LISTEN_CELL_LOCATION);
		notify("Location Updater Started");

		observer = new PhotoObserver(this, pUpdater);
		getApplicationContext().getContentResolver().registerContentObserver(
				MediaStore.Images.Media.EXTERNAL_CONTENT_URI, false, observer);
	}

	@Override
	public void onDestroy() {
		getApplicationContext().getContentResolver().unregisterContentObserver(
				observer);
		lUpdater.release();
		pUpdater.release();

		super.onDestroy();
	}
	
	@Override
	public int onStartCommand(Intent intent, int flags, int startId) {
		return Service.START_STICKY;
	}

	public static void start(Context ctx){
		if(service==null)
			ctx.startService(new Intent(ctx.getApplicationContext(),UpdateService.class));
	}

}
