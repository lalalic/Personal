package com.supernaiba.ui;

import greendroid.widget.ActionBarItem;
import greendroid.widget.ActionBarItem.Type;
import greendroid.widget.LoaderActionBarItem;
import greendroid.widget.QuickActionBar;

import java.io.ByteArrayInputStream;

import android.app.Activity;
import android.content.Context;
import android.content.Intent;
import android.graphics.drawable.BitmapDrawable;
import android.graphics.drawable.Drawable;
import android.os.Bundle;
import android.view.LayoutInflater;
import android.view.View;
import android.view.View.OnClickListener;
import android.view.View.OnLongClickListener;
import android.view.ViewGroup;
import android.widget.AdapterView;
import android.widget.AdapterView.OnItemClickListener;
import android.widget.ListView;
import android.widget.PopupWindow;

import com.parse.Magic;
import com.parse.ParseException;
import com.parse.ParseFile;
import com.parse.ParseObject;
import com.parse.ParseQuery;
import com.parse.ParseQuery.CachePolicy;
import com.parse.ParseQueryAdapter.QueryFactory;
import com.parse.ParseUser;
import com.supernaiba.R;
import com.supernaiba.data.DB;
import com.supernaiba.parse.OnGet;
import com.supernaiba.parse.OnGetFileData;
import com.supernaiba.parse.Query;
import com.supernaiba.parse.QueryAdapter;

public class Main extends BaseQueryListActivity {
	private final static int CHILD=0;
	private final static int SIGNIN=1;
	
	QuickActionBar childrenBar=null;
	LoaderActionBarItem defaultChildAction;
	ListView vChildren;
	/** Called when the activity is first created. */
	public void onCreate(Bundle savedInstanceState) {
		title=R.string.app_name;
		super.onCreate(savedInstanceState);
	}
	
	@Override
	protected QueryAdapter<ParseObject> createAdapter(){
		QueryAdapter<ParseObject> adapter=new QueryAdapter<ParseObject>(this, new QueryFactory<ParseObject>(){
			@Override
			public ParseQuery<ParseObject> create() {
				Query<ParseObject> query=new Query<ParseObject>("tag");
				query.whereEqualTo("category","category");
				return query;
			}
			
		},null);
		adapter.setImageKey("thumbnail");
		adapter.setTextKey("name");
		return adapter;
	}
	
	@Override
	protected void createActionBarItem(){
		defaultChildAction=(LoaderActionBarItem)this.getActionBar().newActionBarItem(LoaderActionBarItem.class);
		addActionBarItem(defaultChildAction,R.layout.gd_action_bar_item_loader);
		
		showDefaultChild();
	}
	
	@Override
	protected void createFooterBarItem(){
		createFooterBar(Type.Share, Type.Compass, Type.AllFriends);
	}
	

	@Override
	public boolean onHandleActionBarItemClick(ActionBarItem item, int position) {
		switch(item.getItemId()){
		case R.layout.gd_action_bar_item_loader:
			defaultChildAction.setLoading(false);
			if(!Magic.isLoggedIn()){
				Intent intent=new Intent(Main.this,UserAccount.class);
				intent.putExtra("type", UserAccount.Type.Signin.name());
				startActivityForResult(intent, SIGNIN);
				break;
			}else
				getChildrenWindow().showAsDropDown(item.getItemView());
			break;
		}
		return true; 
	}



	@Override
	public void onHandleFooterBarItemClick(ActionBarItem item, int position) {
		Intent intent=null;
		switch(item.getItemId()){
		case R.drawable.gd_action_bar_compass:
			intent=new Intent(this,ShowFavorites.class);
		break;
		case R.drawable.gd_action_bar_all_friends:
			intent=new Intent(this,ShowTasks.class);
		break;
		}
		if(intent!=null) 
			startActivity(intent);
	}



	private void setDefaultChild(ParseObject child) {
		String defaultChildId=DB.getInstance(this).get("DefaultChild");
		if(child.getObjectId().equals(defaultChildId))
			return;
		DB.getInstance(this).set("DefaultChild", child.getObjectId());
		showDefaultChild();
	}
	
	
	private void showDefaultChild(){
		if(!Magic.isLoggedIn()){
			defaultChildAction.setDrawable(android.R.drawable.ic_secure);
			return;
		}
		defaultChildAction.setLoading(true);
		String id=DB.getInstance(this).get("DefaultChild");
		Query<ParseObject> children=new Query<ParseObject>("child");
		if(id!=null && id.length()!=0)
			children.whereEqualTo("objectId", id);
		else
			children.whereEqualTo("parent", ParseUser.getCurrentUser());
		children.getFirstInBackground(new OnGet<ParseObject>(this){
			@Override
			public void done(ParseObject child, ParseException ex) {
				defaultChildAction.setLoading(false);
				super.done(child, ex);
				if(ex!=null)
					defaultChildAction.setDrawable(R.drawable.gd_action_bar_all_friends);
				else if(child==null)
					defaultChildAction.setDrawable(R.drawable.gd_action_bar_add);
				else if(child.containsKey("photo")){
					defaultChildAction.setLoading(true);
					ParseFile photo=child.getParseFile("photo");
					photo.getDataInBackground(new OnGetFileData(Main.this,photo){

						@Override
						public void done(byte[] data, ParseException ex) {
							defaultChildAction.setLoading(false);
							super.done(data, ex);
							if(data!=null)
								defaultChildAction.setDrawable(Drawable.createFromStream(new ByteArrayInputStream(data), null));
							else
								defaultChildAction.setDrawable(R.drawable.gd_action_bar_all_friends);
						}
						
					});
					
				}else
					defaultChildAction.setDrawable(android.R.drawable.ic_menu_camera);
				
			}
		});
	}

	@Override
	protected void onListItemClick(ListView l, View v, int position, long id) {
		Intent intent=new Intent(this,ShowPosts.class);
		intent.putExtra("type", ((ParseObject)v.getTag()).getString("name"));
		this.startActivity(intent);
	}

	@Override
	protected void onActivityResult(int requestCode, int resultCode, Intent data) {
		if(resultCode==Activity.RESULT_CANCELED){
			super.onActivityResult(requestCode, resultCode, data);
			return;
		}
		switch(requestCode){
		case CHILD:
			showDefaultChild();
			refreshChildrenWindow();
			break;
		case SIGNIN:
			showDefaultChild();
			refreshChildrenWindow();
			break;
		}
	}	
	
	private void refreshChildrenWindow(){
		if(!Magic.isLoggedIn())
			return;
		
		QueryAdapter<ParseObject> adapter=new QueryAdapter<ParseObject>(this,new QueryFactory<ParseObject>(){
			@Override
			public ParseQuery<ParseObject> create() {
				Query<ParseObject> query=new Query<ParseObject>("child");
				query.whereEqualTo("parent", ParseUser.getCurrentUser());
				query.setCachePolicy(CachePolicy.CACHE_ONLY);
				return query;
			}
		},null){
			@Override
			public View getItemView(ParseObject object, View v, ViewGroup parent) {
				/*
				LinearLayout view=(LinearLayout)super.getItemView(object, v, parent);
				if(this.getCount()>1)
					view.setSelected(isDefaultChild(object));
			*/
				return super.getItemView(object, v, parent);
			}
		};
		adapter.setPlaceholder(getResources().getDrawable(android.R.drawable.ic_menu_camera));
		adapter.setImageKey("photo");
		adapter.setTextKey(null);
		vChildren.setAdapter(adapter);
	}
	
	private PopupWindow childrenWindow;
	private PopupWindow getChildrenWindow(){
		if(childrenWindow==null){
			LayoutInflater inflater=(LayoutInflater)this.getSystemService(Context.LAYOUT_INFLATER_SERVICE);
			View view=inflater.inflate(R.layout.children, null);
			vChildren=(ListView)view.findViewById(R.id.children);
			View vCreateChild=view.findViewById(R.id.createChild);
			int width=(int)getResources().getDimension(R.dimen.gd_action_bar_height);
			childrenWindow=new PopupWindow(view,width,width*4);
			vCreateChild.setOnClickListener(new OnClickListener(){
				@Override
				public void onClick(View arg0) {
					startActivityForResult(new Intent(Main.this,CreateChild.class), CHILD);
				}
				
			});
			
			vChildren.setOnItemClickListener(new OnItemClickListener(){

				@Override
				public void onItemClick(AdapterView<?> arg0, View view,
						int arg2, long arg3) {
					setDefaultChild((ParseObject)view.getTag());
				}
				
			});
			
			vChildren.setOnLongClickListener(new OnLongClickListener(){

				@Override
				public boolean onLongClick(View view) {//edit
					Intent intent=new Intent(Main.this,CreateChild.class);
					intent.putExtra("id", ((ParseObject)view.getTag()).getObjectId());
					startActivityForResult(new Intent(Main.this,CreateChild.class), CHILD);
					return false;
				}
				
			});
			refreshChildrenWindow();
		}
		childrenWindow.setFocusable(true);
		childrenWindow.setOutsideTouchable(true);
		childrenWindow.setBackgroundDrawable(new BitmapDrawable()); 
		return childrenWindow;
	}
}
