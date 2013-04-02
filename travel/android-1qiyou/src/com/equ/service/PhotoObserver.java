package com.equ.service;

import java.util.ArrayList;

import android.content.Context;
import android.database.ContentObserver;
import android.database.Cursor;
import android.provider.MediaStore;
import android.provider.MediaStore.MediaColumns;

import com.equ.photo.PhotoUpdater;

public class PhotoObserver extends ContentObserver {
	Context ctx;
	PhotoUpdater updater;
	public PhotoObserver(Context ctx,PhotoUpdater updater) {
		super(null);
		this.ctx=ctx;
		this.updater=updater;
	}

	@Override
	public void onChange(boolean selfChange) {
		super.onChange(selfChange);
		Cursor cursor = ctx.getContentResolver().query(MediaStore.Images.Media.EXTERNAL_CONTENT_URI, null, null,
		        null, "date_added DESC");
		    if (cursor.moveToNext()) {
		        ArrayList<Integer> id=new ArrayList<Integer>();
		        id.add(cursor.getInt(cursor.getColumnIndexOrThrow(MediaColumns._ID)));
		       updater.add(id);
		    }
		    cursor.close();
	}

}
