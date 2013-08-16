package com.supernaiba.util;

import java.io.ByteArrayOutputStream;

import android.app.Activity;
import android.content.Context;
import android.content.Intent;
import android.graphics.Bitmap;
import android.graphics.Bitmap.CompressFormat;
import android.provider.MediaStore;

import com.supernaiba.R;

public class Photo {
	public static final int NEW_PHOTO = 0;
	
	public static void takePhoto(Activity ui) {
		Intent pick = new Intent(Intent.ACTION_GET_CONTENT);
		pick.setType("image/*");

		Intent photo = new Intent(MediaStore.ACTION_IMAGE_CAPTURE);
		Intent chooserIntent = Intent.createChooser(pick, ui.getString(R.string.make_photo));
		chooserIntent.putExtra(Intent.EXTRA_INITIAL_INTENTS,
				new Intent[] { photo });
		ui.startActivityForResult(chooserIntent, NEW_PHOTO);
	}
	
	public static byte[] getBytes(Context ctx, Intent data){
		return getBytes(getBitmap(ctx, data));
	}
	
	public static Bitmap getBitmap(Context ctx, Intent data){
		return data.getExtras().containsKey("data") ? (Bitmap)data.getExtras().get("data") :
			MediaStore.Images.Thumbnails.getThumbnail(ctx.getContentResolver(), 
					Integer.parseInt(data.getData().getLastPathSegment()), 
					MediaStore.Images.Thumbnails.MICRO_KIND, 
					null);
	}
	
	public static byte[] getBytes(Bitmap bm){
		if(bm==null)
			return null;
		ByteArrayOutputStream os=new ByteArrayOutputStream();
		bm.compress(CompressFormat.JPEG, 80, os);
		byte[] photoData=os.toByteArray();
		return photoData;
	}
}
