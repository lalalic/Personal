package com.supernaiba.ui;

import greendroid.app.GDListActivity;
import greendroid.widget.ActionBar.OnActionBarListener;
import greendroid.widget.ActionBarItem.Type;
import greendroid.widget.ToolBar;
import android.app.SearchManager;
import android.content.Intent;
import android.os.Bundle;
import android.view.View;
import android.widget.ListView;

import com.parse.ParseAnalytics;
import com.supernaiba.R;

public class ShowPosts extends GDListActivity {
	/** Called when the activity is first created. */
	public void onCreate(Bundle savedInstanceState) {
		super.onCreate(savedInstanceState);
		ParseAnalytics.trackAppOpened(getIntent());
		
		this.setTitle(getIntent().getStringExtra("type"));
		
		this.addActionBarItem(Type.Search);
		this.addActionBarItem(Type.Refresh);
		
		
		ToolBar footer=ToolBar.inflate(this);
		footer.setMaxItemCount(3);
		footer.addItem(Type.Add);
		footer.addItem(Type.Star);
		footer.addItem(Type.AllFriends);	
		
		footer.setOnActionBarListener(new OnActionBarListener(){

			@Override
			public void onActionBarItemClicked(int position) {
				switch(position){
				case 0:
				default:
					Intent intent=new Intent(ShowPosts.this,CreatePost.class);
					intent.putExtra("type", ShowPosts.this.getIntent().getStringExtra("type"));
					ShowPosts.this.startActivity(intent);
				break;
				}
				
			}
			
		});
		
		this.getActionBar().setOnActionBarListener(new OnActionBarListener(){

			@Override
			public void onActionBarItemClicked(int position) {
				switch(position){
				case 0:
				default:
					ShowPosts.this.onBackPressed();
				break;
				}
			}
			
		});
		
		if(Intent.ACTION_SEARCH.equals(this.getIntent().getAction())){
			this.setTitle(R.string.search);
			String query=getIntent().getStringExtra(SearchManager.QUERY);
			if(query!=null){
				
			}
		}
	}

	@Override
	protected void onListItemClick(ListView l, View v, int position, long id) {
		Intent intent=new Intent(this,ShowPost.class);
		intent.putExtra("ID", id);
		this.startActivity(intent);
	}

}
