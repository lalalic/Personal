package com.supernaiba.ui;

import greendroid.app.GDActivity;
import greendroid.widget.ActionBar.OnActionBarListener;
import greendroid.widget.ActionBarItem.Type;
import greendroid.widget.ToolBar;
import android.content.Intent;
import android.os.Bundle;

import com.parse.ParseAnalytics;
import com.supernaiba.R;

public class ShowPost extends GDActivity {
	protected long ID;
	/** Called when the activity is first created. */
	public void onCreate(Bundle savedInstanceState) {
		super.onCreate(savedInstanceState);
		ParseAnalytics.trackAppOpened(getIntent());
		
		this.setTitle(R.string.loading);
		this.addActionBarItem(Type.Refresh);
		
		
		ToolBar footer=ToolBar.inflate(this);
		footer.setMaxItemCount(4);
		footer.addItem(Type.Edit);//comment
		footer.addItem(Type.Star);
		footer.addItem(Type.Share);
		
		footer.setOnActionBarListener(new OnActionBarListener(){

			@Override
			public void onActionBarItemClicked(int position) {
				switch(position){
				case 0:
				default:
					Intent intent=new Intent(ShowPost.this,ShowComments.class);
					intent.putExtra("ID", ShowPost.this.ID);
					ShowPost.this.startActivity(intent);
				break;
				}
				
			}
			
		});
		
		this.getActionBar().setOnActionBarListener(new OnActionBarListener(){

			@Override
			public void onActionBarItemClicked(int position) {
				switch(position){
				case OnActionBarListener.HOME_ITEM:
				default:
					onBackPressed();
				break;
				}
				
			}
			
		});
	}

}
