package com.supernaiba.ui;

import greendroid.app.GDActivity;
import greendroid.widget.ActionBar.OnActionBarListener;
import greendroid.widget.ActionBarItem.Type;
import greendroid.widget.ToolBar;
import android.os.Bundle;

import com.parse.ParseAnalytics;
import com.supernaiba.R;

public class CreatePost extends GDActivity {
	/** Called when the activity is first created. */
	public void onCreate(Bundle savedInstanceState) {
		super.onCreate(savedInstanceState);
		ParseAnalytics.trackAppOpened(getIntent());
		
		this.setTitle(getString(R.string.creating)+getIntent().getStringExtra("type"));
		
		this.addActionBarItem(Type.Trashcan);
		this.addActionBarItem(Type.Refresh);
		
		
		ToolBar footer=ToolBar.inflate(this);
		footer.setMaxItemCount(3);
		footer.addItem(Type.TakePhoto);
		footer.addItem(Type.Eye);

		footer.addItem(Type.Export);
		
		footer.setOnActionBarListener(new OnActionBarListener(){

			@Override
			public void onActionBarItemClicked(int position) {
				// TODO Auto-generated method stub
				
			}
			
		});
		
		this.getActionBar().setOnActionBarListener(new OnActionBarListener(){

			@Override
			public void onActionBarItemClicked(int position) {
				switch(position){
				case 0:
				default:
					CreatePost.this.onBackPressed();
				break;
				}
				
			}
			
		});
		
		this.setActionBarContentView(R.layout.create);
	}


}
