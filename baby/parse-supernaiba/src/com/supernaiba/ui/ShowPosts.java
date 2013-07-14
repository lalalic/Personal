package com.supernaiba.ui;

import greendroid.app.GDListActivity;
import greendroid.widget.ActionBar.OnActionBarListener;
import greendroid.widget.ActionBarItem.Type;
import greendroid.widget.ItemAdapter;
import greendroid.widget.ToolBar;
import greendroid.widget.item.ThumbnailItem;

import java.util.List;

import android.content.Intent;
import android.os.Bundle;
import android.view.View;
import android.widget.ListView;

import com.parse.FindCallback;
import com.parse.ParseAnalytics;
import com.parse.ParseException;
import com.parse.ParseObject;
import com.parse.ParseQuery;
import com.supernaiba.R;

public class ShowPosts extends GDListActivity {
	ParseQuery<ParseObject> query;
	ItemAdapter adapter;
	/** Called when the activity is first created. */
	public void onCreate(Bundle savedInstanceState) {
		super.onCreate(savedInstanceState);
		ParseAnalytics.trackAppOpened(getIntent());
		
		query=ParseQuery.getQuery(getIntent().getStringExtra("type"));
		this.setTitle(query.getClassName());
		
		this.addActionBarItem(Type.Search);
		this.addActionBarItem(Type.Refresh);
		
		
		ToolBar footer=ToolBar.inflate(this);
		footer.setMaxItemCount(3);
		footer.addItem(Type.Add);
		footer.addItem(Type.Star);
		footer.addItem(Type.AllFriends);	
		
		adapter=new ItemAdapter(this);
		this.setListAdapter(adapter);
		
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
			//String condition=getIntent().getStringExtra(SearchManager.QUERY);
			
		}
		
		query.findInBackground(new FindCallback<ParseObject>(){
			@Override
			public void done(List<ParseObject> posts, ParseException ex) {
				for(ParseObject post: posts)
					adapter.add(new ThumbnailItem(post.getString("title"), null, 
							R.drawable.gd_action_bar_item, 
							post.containsKey("thumbnail")?post.getParseFile("thumbnail").getUrl() : null));
			}
			
		});
	}

	@Override
	protected void onListItemClick(ListView l, View v, int position, long id) {
		Intent intent=new Intent(this,ShowPost.class);
		intent.putExtra("id", v.getTag().toString());
		this.startActivity(intent);
	}

}
