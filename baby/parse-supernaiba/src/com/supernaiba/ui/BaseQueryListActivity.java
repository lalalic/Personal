package com.supernaiba.ui;

import greendroid.app.GDListActivity;
import greendroid.widget.ActionBarItem;
import greendroid.widget.ActionBarItem.Type;
import greendroid.widget.LoaderActionBarItem;
import android.app.Activity;
import android.content.Intent;
import android.os.Bundle;
import android.view.View;
import android.widget.ListView;

import com.parse.ParseAnalytics;
import com.parse.ParseObject;
import com.parse.ParseQuery;
import com.parse.ParseQueryAdapter.QueryFactory;
import com.supernaiba.R;
import com.supernaiba.parse.Query;
import com.supernaiba.parse.QueryAdapter;

public abstract class BaseQueryListActivity extends GDListActivity {
	protected LoaderActionBarItem refreshAction;
	protected Class<? extends Activity> itemActivity=ShowPost.class;
	protected QueryAdapter<ParseObject> adapter;
	protected int title;
	/** Called when the activity is first created. */
	public void onCreate(Bundle savedInstanceState) {
		super.onCreate(savedInstanceState);
		ParseAnalytics.trackAppOpened(getIntent());
		if(title!=0)
			setTitle(getString(title));
		createActionBarItem();
		createFooterBarItem();
		setListAdapter(adapter=createAdapter());
	}

	protected QueryAdapter<ParseObject> createAdapter() {
		return new QueryAdapter<ParseObject>(this,new QueryFactory<ParseObject>(){
			@Override
			public ParseQuery<ParseObject> create() {
				return createQuery();
			}
		},refreshAction);
	}
	

	protected Query<ParseObject> createQuery(){
		return null;
	}

	@Override
	public boolean onHandleActionBarItemClick(ActionBarItem item, int position) {
		switch(item.getItemId()){
		case R.drawable.gd_action_bar_refresh:
			refresh();
			break;
		case R.drawable.gd_action_bar_home:
			onBackPressed();
		}
		return true;
	}

	protected void refresh() {
		adapter.clear();
		adapter.loadObjects();
		adapter.notifyDataSetChanged();
	}

	@Override
	protected void onListItemClick(ListView l, View v, int position, long id) {
		if(itemActivity==null)
			return;
		Intent intent=new Intent(this, itemActivity);
		intent.putExtra("ID", ((ParseObject)v.getTag()).getObjectId());
		this.startActivity(intent);
	}
	
	protected void createActionBarItem(){
		refreshAction=(LoaderActionBarItem)addActionBarItem(Type.Refresh);
		refreshAction.setLoading(true);
	}
	protected void createFooterBarItem() {}
}
