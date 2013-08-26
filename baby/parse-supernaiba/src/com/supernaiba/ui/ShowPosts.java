package com.supernaiba.ui;

import greendroid.widget.ActionBarItem;
import greendroid.widget.ActionBarItem.Type;
import android.content.Intent;
import android.os.Bundle;
import android.view.View;
import android.widget.ListView;

import com.parse.ParseObject;
import com.parse.ParseQuery;
import com.parse.ParseQueryAdapter.QueryFactory;
import com.supernaiba.R;
import com.supernaiba.parse.StatQueryAdapter;
import com.supernaiba.parse.Query;
import com.supernaiba.parse.QueryAdapter;

public class ShowPosts extends BaseQueryListActivity {
	private String category;
	//private String search;
	/** Called when the activity is first created. */
	public void onCreate(Bundle savedInstanceState) {
		category=getIntent().getStringExtra("type");
		super.onCreate(savedInstanceState);
		setTitle(category);
		
		/*
		if(Intent.ACTION_SEARCH.equals(this.getIntent().getAction())){
			this.setTitle(R.string.search);
			search=getIntent().getStringExtra(SearchManager.QUERY);
		}
		*/
	}
	
	
	@Override
	protected void createActionBarItem() {
		addActionBarItem(Type.Search);
		super.createActionBarItem();
	}
	
	@Override
	protected void createFooterBarItem(){
		createFooterBar(Type.Add, Type.Star);
	}


	@Override
	public boolean onHandleActionBarItemClick(ActionBarItem item, int position) {
		switch(item.getItemId()){
		case R.drawable.gd_action_bar_search:
			onSearchRequested();
		break;
		}
		return super.onHandleActionBarItemClick(item, position);
	}

	@Override
	public void onHandleFooterBarItemClick(ActionBarItem item, int position) {
		switch(item.getItemId()){
		case R.drawable.gd_action_bar_add://add
			Intent intent=new Intent(this,CreatePost.class);
			intent.putExtra("category", category);
			startActivity(intent);
		break;
		}
	}

	@Override
	protected QueryAdapter createAdapter(){
		StatQueryAdapter adapter=new StatQueryAdapter(this,new QueryFactory<ParseObject>(){
			@Override
			public ParseQuery<ParseObject> create() {
				return createQuery();
			}
		},refreshAction);
		adapter.setStatisitcs(new ParseObject("statistics"));

		return adapter;
	}
	
	
	@Override
	protected Query<ParseObject> createQuery(){
		adapter.setTextKey("title");
		adapter.setImageKey("thumbnail");
		
		Query<ParseObject> query=new Query<ParseObject>("post");
		query.whereEqualTo("category", category);
		return query;
	}
	
	
	
	@Override
	protected void onListItemClick(ListView l, View v, int position, long id) {
		if(adapter.getItemViewType(position)==StatQueryAdapter.STATISTICS)
			return;
		super.onListItemClick(l, v, position, id);
	}
	
}
