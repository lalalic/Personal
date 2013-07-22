package com.supernaiba.ui;

import greendroid.app.GDActivity;
import greendroid.widget.ActionBar.OnActionBarListener;
import greendroid.widget.ActionBarItem.Type;
import greendroid.widget.LoaderActionBarItem;
import greendroid.widget.ToolBar;

import java.util.List;

import android.app.SearchManager;
import android.content.Intent;
import android.os.Bundle;
import android.view.View;
import android.view.ViewGroup;
import android.widget.AdapterView;
import android.widget.AdapterView.OnItemClickListener;
import android.widget.ListView;

import com.parse.ParseObject;
import com.parse.ParseQuery;
import com.parse.ParseQueryAdapter.OnQueryLoadListener;
import com.parse.ParseQueryAdapter.QueryFactory;
import com.supernaiba.R;
import com.supernaiba.parse.QueryAdapter;

public class ShowPosts extends GDActivity {
	String postType;
	String search;
	LoaderActionBarItem refreshAction;
	ListView vPosts;
	/** Called when the activity is first created. */
	public void onCreate(Bundle savedInstanceState) {
		super.onCreate(savedInstanceState);
		setActionBarContentView(R.layout.posts);
		vPosts=(ListView)findViewById(R.id.posts);
		
		postType=getIntent().getStringExtra("type");
		this.setTitle(postType);

		this.addActionBarItem(Type.Search);
		refreshAction=(LoaderActionBarItem)addActionBarItem(getActionBar().newActionBarItem(LoaderActionBarItem.class));
		refreshAction.setDrawable(getResources().getDrawable(R.drawable.gd_action_bar_refresh));
		
		
		ToolBar footer=ToolBar.inflate(this);
		footer.setMaxItemCount(2);
		footer.addItem(Type.Add);
		footer.addItem(Type.Star);	
		
		footer.setOnActionBarListener(new OnActionBarListener(){

			@Override
			public void onActionBarItemClicked(int position) {
				switch(position){
				case 0://add
					Intent intent=new Intent(ShowPosts.this,CreatePost.class);
					intent.putExtra("type", ShowPosts.this.getIntent().getStringExtra("type"));
					startActivity(intent);
				break;
				}
				
			}
			
		});
		
		this.getActionBar().setOnActionBarListener(new OnActionBarListener(){

			@Override
			public void onActionBarItemClicked(int position) {
				switch(position){
				case 1:
					refresh();
					break;
				case 0:
				default:
					onSearchRequested();
				break;
				}
			}
			
		});
		
		if(Intent.ACTION_SEARCH.equals(this.getIntent().getAction())){
			this.setTitle(R.string.search);
			search=getIntent().getStringExtra(SearchManager.QUERY);
		}
		
		vPosts.setOnItemClickListener(new OnItemClickListener(){

			@Override
			public void onItemClick(AdapterView<?> arg0, View view, int arg2,
					long arg3) {
				Intent intent=new Intent(ShowPosts.this,ShowPost.class);
				intent.putExtra("ID",((ParseObject)view.getTag()).getObjectId());
				startActivity(intent);
			}
			
		});
		refresh();
	}
	
	private void refresh(){
		QueryAdapter<ParseObject> adapter=new QueryAdapter<ParseObject>(this,new QueryFactory<ParseObject>(){
			@Override
			public ParseQuery<ParseObject> create() {
				ParseQuery<ParseObject> query=new ParseQuery<ParseObject>("post");
				query.whereEqualTo("category", postType);
				return query;
			}
		}){

			@Override
			public View getItemView(ParseObject obj, View v, ViewGroup parent) {
				View view=super.getItemView(obj, v, parent);
				//show if favorite
				return view;
			}
			
		};
		adapter.setPlaceholder(this.getResources().getDrawable(R.drawable.gd_action_bar_compass));
		adapter.setTextKey("title");
		adapter.setImageKey("thumbnail");
		adapter.setPaginationEnabled(true);
		adapter.setObjectsPerPage(20);
		adapter.addOnQueryLoadListener(new OnQueryLoadListener<ParseObject>(){

			@Override
			public void onLoaded(List<ParseObject> arg0, Exception arg1) {
				refreshAction.setLoading(false);
			}

			@Override
			public void onLoading() {
				refreshAction.setLoading(true);
			}
			
		});
		vPosts.setAdapter(adapter);
	}
}
