package com.supernaiba.ui;

import greendroid.app.GDListActivity;
import greendroid.widget.ActionBar.OnActionBarListener;
import greendroid.widget.ActionBarItem.Type;
import greendroid.widget.ToolBar;
import android.content.Intent;
import android.os.Bundle;
import android.view.View;
import android.widget.ArrayAdapter;
import android.widget.ListView;

import com.parse.ParseAnalytics;
import com.supernaiba.R;

public class Main extends GDListActivity {
	/** Called when the activity is first created. */
	public void onCreate(Bundle savedInstanceState) {
		super.onCreate(savedInstanceState);
		ParseAnalytics.trackAppOpened(getIntent());
		
		this.addActionBarItem(Type.AllFriends);
		
		ToolBar footer=ToolBar.inflate(this);
		footer.setMaxItemCount(3);
		footer.addItem(Type.Share);
		footer.addItem(Type.Compass);
		footer.addItem(Type.AllFriends);
		
		footer.setOnActionBarListener(new OnActionBarListener(){

			@Override
			public void onActionBarItemClicked(int position) {
				switch(position){
				case 2:
				default:
					Intent intent=new Intent(Main.this,ShowTasks.class);
					Main.this.startActivity(intent);
				break;
				}
				
			}
			
		});
		
		this.getActionBar().setOnActionBarListener(new OnActionBarListener(){

			@Override
			public void onActionBarItemClicked(int position) {
				switch(position){
				case 0:
					Intent intent=new Intent(Main.this,UserAccount.class);
					intent.putExtra("type", UserAccount.Type.Signin.name());
					Main.this.startActivityForResult(intent, 1);
					break;
				}
			}
			
		});
		
		getListView()
			.setAdapter(ArrayAdapter.createFromResource(this, R.array.categories, android.R.layout.simple_list_item_1));
		
		
	}

	@Override
	protected void onListItemClick(ListView l, View v, int position, long id) {
		Intent intent=new Intent(this,ShowPosts.class);
		intent.putExtra("type", this.getResources().getStringArray(R.array.categories)[position]);
		this.startActivity(intent);
	}

	@Override
	protected void onActivityResult(int requestCode, int resultCode, Intent data) {
		switch(requestCode){
		case 1:
			refresh();
			break;
		}
	}
	
	protected void refresh(){
		
	}
	

}
