package com.supernaiba.ui;

import greendroid.app.GDActivity;
import greendroid.widget.ActionBarItem;
import greendroid.widget.ActionBarItem.Type;
import android.annotation.TargetApi;
import android.app.Activity;
import android.content.Intent;
import android.os.Bundle;

import com.parse.ParseAnalytics;
import com.parse.ParseObject;
import com.supernaiba.R;
import com.supernaiba.util.Photo;

public abstract class BaseCreatorActivity extends GDActivity{
	protected int layout;
	protected int title;
	protected ParseObject obj;
	protected boolean autoSave=true;
	
	/** Called when the activity is first created. */
	public void onCreate(Bundle savedInstanceState) {
		super.onCreate(savedInstanceState);
		ParseAnalytics.trackAppOpened(getIntent());
		setActionBarContentView(layout);
		if(title!=0)
			setTitle(title);
		obj=extract();
		if(obj.getObjectId()!=null)
			populate();
		
		creatActionBarItem();
		createFooterBarItem();
	}
	
	protected abstract ParseObject extract();
	protected abstract Intent save();
	protected abstract void populate();
	
	protected void creatActionBarItem(){
		addActionBarItem(Type.Export);
	}
	protected void createFooterBarItem() {}
	
	
	@Override
	public boolean onHandleActionBarItemClick(ActionBarItem item, int position) {
		switch(item.getItemId()){
		case R.drawable.gd_action_bar_export:
			save();
			finish();
			return true;
		default:
			onBackPressed();
		}
		return true;
	}


	@Override
	public void onHandleFooterBarItemClick(ActionBarItem item, int position) {
		switch(item.getItemId()){
		case R.drawable.gd_action_bar_take_photo:
			Photo.takePhoto(this);
			return;
		}
		super.onHandleFooterBarItemClick(item, position);
	}
	
	@TargetApi(5)
	@Override
	protected void onActivityResult(int requestCode, int resultCode, Intent data) {
		if(resultCode==Activity.RESULT_CANCELED){
			super.onActivityResult(requestCode, resultCode, data);
			return;
		}
		switch(requestCode){
		case Photo.NEW_PHOTO:
			onPhoto(data);
			return;
		default:
			super.onActivityResult(requestCode, resultCode, data);
		}
	}

	protected void onPhoto(Intent data) {}
	
	@Override
	public void onBackPressed() {
		if(autoSave){
			Intent returnIntent=save();
			if(returnIntent!=null)
				setResult(RESULT_OK, returnIntent);
		}
		finish();
		super.onBackPressed();
		
	}
}

