package com.supernaiba.ui;

import greendroid.app.GDListActivity;
import greendroid.widget.ActionBar.OnActionBarListener;
import android.content.Intent;
import android.os.Bundle;
import android.view.View;
import android.widget.ListView;

import com.parse.ParseAnalytics;
import com.parse.ParseObject;
import com.parse.ParseQuery;
import com.parse.ParseQueryAdapter.QueryFactory;
import com.parse.ParseUser;
import com.supernaiba.R;
import com.supernaiba.parse.Query;
import com.supernaiba.parse.QueryAdapter;

public class ShowTasks extends GDListActivity {
	/** Called when the activity is first created. */
	public void onCreate(Bundle savedInstanceState) {
		super.onCreate(savedInstanceState);
		ParseAnalytics.trackAppOpened(getIntent());
		
		this.setTitle(getString(R.string.tasks));		
		this.getActionBar().setOnActionBarListener(new OnActionBarListener(){

			@Override
			public void onActionBarItemClicked(int position) {
				switch(position){
				case 0:
				default:
					ShowTasks.this.onBackPressed();
				break;
				}
			}
			
		});
		
		QueryAdapter<ParseObject> adapter=new QueryAdapter<ParseObject>(this,new QueryFactory<ParseObject>(){
			@Override
			public ParseQuery<ParseObject> create() {
				Query<ParseObject> query=new Query<ParseObject>("task");
				query.whereEqualTo("owner", ParseUser.getCurrentUser());
				return query;
			}
		});
		adapter.setTextKey("title");
		adapter.setImageKey("thumb");
		this.setListAdapter(adapter);
	}

	@Override
	protected void onListItemClick(ListView l, View v, int position, long id) {
		Intent intent=new Intent(this,ShowPost.class);
		intent.putExtra("ID", intent.putExtra("ID", ((ParseObject)v.getTag()).getObjectId()));
		this.startActivity(intent);
	}

}
