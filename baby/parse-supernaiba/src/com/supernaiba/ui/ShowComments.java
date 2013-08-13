package com.supernaiba.ui;

import greendroid.app.GDListActivity;
import greendroid.widget.ActionBar.OnActionBarListener;
import greendroid.widget.ActionBarItem;
import greendroid.widget.ActionBarItem.Type;
import greendroid.widget.LoaderActionBarItem;
import greendroid.widget.ToolBar;

import java.util.List;

import android.os.Bundle;
import android.view.View;
import android.view.ViewGroup;
import android.widget.EditText;

import com.parse.ParseObject;
import com.parse.ParseQuery;
import com.parse.ParseQueryAdapter.OnQueryLoadListener;
import com.parse.ParseQueryAdapter.QueryFactory;
import com.parse.ParseUser;
import com.supernaiba.R;
import com.supernaiba.parse.Query;
import com.supernaiba.parse.QueryAdapter;

public class ShowComments extends GDListActivity {
	private String ID;
	private LoaderActionBarItem refreshAction;
	private EditText vComment;
	QueryAdapter<ParseObject> adapter;
	/** Called when the activity is first created. */
	public void onCreate(Bundle savedInstanceState) {
		super.onCreate(savedInstanceState);
		
		ID=getIntent().getStringExtra("ID");
		this.setTitle(R.string.comments); 
		refreshAction=(LoaderActionBarItem)addActionBarItem(Type.Refresh);
		refreshAction.setLoading(true);
		
		ToolBar footer=ToolBar.inflate(this);
		footer.setMaxItemCount(4);
		footer.addSizedItem(new ActionBarItem(){

			@Override
			protected View createItemView() {
				vComment=new EditText(ShowComments.this);
				vComment.setHint(R.string.comments);
				vComment.setBackgroundResource(R.drawable.white);
				return vComment;
			}
			
		},3);
		footer.addItem(Type.Export);
		
		footer.setOnActionBarListener(new OnActionBarListener(){

			@Override
			public void onActionBarItemClicked(int position) {
				switch(position){
				case 1:
					String content=vComment.getText().toString().trim();
					if(content.length()==0)
						return;
					ParseUser user=ParseUser.getCurrentUser();
					ParseObject comment=new ParseObject("comment");
					comment.put("content", content);
					comment.put("author", user.getUsername());
					comment.put("post", ID);
					comment.saveEventually();
					refresh();
					vComment.setText("");
					break;
				}
			}
			
		});
		
		this.getActionBar().setOnActionBarListener(new OnActionBarListener(){

			@Override
			public void onActionBarItemClicked(int position) {
				switch(position){
				case 0:
					refresh();
					break;
				default:
					onBackPressed();
				break;
				}
			}
			
		});
		adapter=new QueryAdapter<ParseObject>(this,new QueryFactory<ParseObject>(){
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
		adapter.setTextKey("content");
		adapter.setPaginationEnabled(true);
		adapter.setObjectsPerPage(20);
		adapter.addOnQueryLoadListener(new OnQueryLoadListener<ParseObject>(){

			@Override
			public void onLoaded(List<ParseObject> objects, Exception arg1) {
				refreshAction.setLoading(false);
			}

			@Override
			public void onLoading() {
				refreshAction.setLoading(true);
			}
			
		});
		this.setListAdapter(adapter);
		
	}
	
	private void refresh(){
		adapter.clear();
		adapter.loadObjects();
		adapter.notifyDataSetChanged();
	}

}
