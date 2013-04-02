package com.yy.m.view;

import java.io.File;

import android.app.Activity;
import android.content.Intent;
import android.provider.MediaStore;
import android.widget.Toast;

public class BaseActivity extends Activity {
	public final static int AUDIO = 0;
	public final static int PHOTO = 1;
	public final static int VIDEO = 2;
	public final static int FILE = 3;
	public void notify(String message){
		try {
			Toast.makeText(this,
					message,
					Toast.LENGTH_LONG).show();
		} catch (Throwable e) {
			
		}
	}
		
	public void notify(int rid){
		notify(this.getString(rid));
	}

	@Override
	public File getCacheDir() {
		return this.getApplicationContext().getCacheDir();
	}
	
	public void openFileDialog(String callback,String type){
		Intent intent = new Intent(Intent.ACTION_GET_CONTENT); 
		intent.setType(type!=null?type:"*/*"); 
		
        intent.addCategory(Intent.CATEGORY_OPENABLE);
        if(callback!=null)
        	intent.putExtra("callback", callback);
        
        try {
            this.startActivityForResult(
                    Intent.createChooser(intent, "Select a File"),
                    FILE);
        } catch (android.content.ActivityNotFoundException ex) {
           
        }
	}
	
	public void photo(String callback) {
		Intent pick = new Intent(Intent.ACTION_GET_CONTENT);
		pick.setType("image/*");

		Intent photo = new Intent(MediaStore.ACTION_IMAGE_CAPTURE);
		String pickTitle = "Select or take a new Picture";
		Intent chooserIntent = Intent.createChooser(pick, pickTitle);
		chooserIntent.putExtra(Intent.EXTRA_INITIAL_INTENTS,
				new Intent[] { photo });
		photo.putExtra("callback", callback);
		chooserIntent.putExtra("callback", callback);
		this.startActivityForResult(chooserIntent, PHOTO);
	}

	public void video(String callback) {
		Intent pick = new Intent(Intent.ACTION_GET_CONTENT);
		pick.setType("video/*");

		Intent video = new Intent(MediaStore.ACTION_VIDEO_CAPTURE);
		String pickTitle = "Select or take a new video";
		Intent chooserIntent = Intent.createChooser(pick, pickTitle);
		chooserIntent.putExtra(Intent.EXTRA_INITIAL_INTENTS,
				new Intent[] { video });
		video.putExtra("callback", callback);
		chooserIntent.putExtra("callback", callback);
		this.startActivityForResult(chooserIntent, VIDEO);
	}
	
	
}
