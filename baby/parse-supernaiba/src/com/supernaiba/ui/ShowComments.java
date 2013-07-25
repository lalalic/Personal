package com.supernaiba.ui;

import greendroid.app.GDListActivity;
import greendroid.widget.ActionBar.OnActionBarListener;
import greendroid.widget.ActionBarItem.Type;
import greendroid.widget.LoaderActionBarItem;
import greendroid.widget.ToolBar;

import java.util.List;

import android.os.Bundle;
import android.view.View;
import android.view.ViewGroup;

import com.parse.ParseObject;
import com.parse.ParseQuery;
import com.parse.ParseQueryAdapter.OnQueryLoadListener;
import com.parse.ParseQueryAdapter.QueryFactory;
import com.supernaiba.R;
import com.supernaiba.parse.Query;
import com.supernaiba.parse.QueryAdapter;

public class ShowComments extends GDListActivity {
	private String ID;
	private LoaderActionBarItem refreshAction;
	/** Called when the activity is first created. */
	public void onCreate(Bundle savedInstanceState) {
		super.onCreate(savedInstanceState);
		
		ID=getIntent().getStringExtra("ID");
		this.setTitle(R.string.comments); 
		refreshAction=(LoaderActionBarItem)addActionBarItem(Type.Refresh);
		refreshAction.setLoading(true);
		
		ToolBar footer=ToolBar.inflate(this);
		footer.setMaxItemCount(4);
		footer.addItem(Type.Export);
		
		footer.setOnActionBarListener(new OnActionBarListener(){

			@Override
			public void onActionBarItemClicked(int position) {
				
			}
			
		});
		
		this.getActionBar().setOnActionBarListener(new OnActionBarListener(){

			@Override
			public void onActionBarItemClicked(int position) {
				switch(position){
				case 0:
				default:
					onBackPressed();
				break;
				}
			}
			
		});
		refresh();
	}
	
	private void refresh(){
		QueryAdapter<ParseObject> adapter=new QueryAdapter<ParseObject>(this,new QueryFactory<ParseObject>(){
			@Override
			public ParseQuery<ParseObject> create() {
				Query<ParseObject> query=new Query<ParseObject>("comment");
				query.whereEqualTo("post", ID);
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
		adapter.setTextKey("title");
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
		this.setListAdapter(adapter);
	}

}
