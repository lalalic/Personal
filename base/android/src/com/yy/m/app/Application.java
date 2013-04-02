package com.yy.m.app;

import java.io.File;

import android.os.Environment;

public class Application extends android.app.Application {
	// NOTE: the content of this path will be deleted
	//       when the application is uninstalled (Android 2.2 and higher)
	protected File extStorageAppBasePath;

	protected File extStorageAppCachePath;

	@Override
	public void onCreate()
	{
		super.onCreate();
		if (!Environment.MEDIA_MOUNTED.equals(Environment.getExternalStorageState()))
			return;
		File externalStorageDir = Environment.getExternalStorageDirectory();
		if (externalStorageDir != null){
			// {SD_PATH}/Android/data/com.xx/webviewcacheonsd
			extStorageAppBasePath = new File(externalStorageDir.getAbsolutePath() +
				File.separator + "Android" + File.separator + "data" +
				File.separator + getPackageName());
		}

		if (extStorageAppBasePath != null){
			// {SD_PATH}/Android/data/com.xx/webviewcacheonsd/cache
			extStorageAppCachePath = new File(extStorageAppBasePath.getAbsolutePath() +
				File.separator + "cache");

			boolean isCachePathAvailable = true;

			if (!extStorageAppCachePath.exists()){
				// Create the cache path on the external storage
				isCachePathAvailable = extStorageAppCachePath.mkdirs();
			}

			if (!isCachePathAvailable){
				// Unable to create the cache path
				extStorageAppCachePath = null;
			}
		}

	}

	@Override
	public File getCacheDir()
	{
		// NOTE: this method is used in Android 2.2 and higher
		// 2.1: Activity.getCacheDir should be override with getApplicationContext().getCacheDir();
		if (extStorageAppCachePath != null){
			return extStorageAppCachePath;
		}else{
			// /data/data/com.xx/cache
			return super.getCacheDir();
		}
	}

}
