package com.supernaiba.ui;

import greendroid.app.GDListActivity;
import greendroid.widget.ActionBar.OnActionBarListener;
import greendroid.widget.ActionBarItem.Type;
import greendroid.widget.ItemAdapter;
import greendroid.widget.LoaderActionBarItem;
import greendroid.widget.QuickActionBar;
import greendroid.widget.ToolBar;

import java.io.ByteArrayInputStream;

import android.app.Activity;
import android.content.Context;
import android.content.Intent;
import android.graphics.drawable.BitmapDrawable;
import android.graphics.drawable.Drawable;
import android.net.ParseException;
import android.os.Bundle;
import android.view.LayoutInflater;
import android.view.View;
import android.view.View.OnClickListener;
import android.view.View.OnLongClickListener;
import android.view.ViewGroup;
import android.widget.AdapterView;
import android.widget.AdapterView.OnItemClickListener;
import android.widget.LinearLayout;
import android.widget.ListView;
import android.widget.PopupWindow;

import com.kinvey.android.AsyncAppData;
import com.kinvey.android.Client;
import com.kinvey.android.callback.KinveyListCallback;
import com.kinvey.android.offline.SqlLiteOfflineStore;
import com.kinvey.java.Query;
import com.kinvey.java.cache.CachePolicy;
import com.kinvey.java.offline.OfflinePolicy;
import com.supernaiba.R;
import com.supernaiba.baas.OnGetFileData;
import com.supernaiba.baas.QueryAdapter;
import com.supernaiba.data.DB;
import com.supernaiba.entity.Child;
import com.supernaiba.entity.Entity;

public class Main extends GDListActivity {
	private final static int CHILD=0;
	private final static int SIGNIN=1;
	
	QuickActionBar childrenBar=null;
	LoaderActionBarItem defaultChildAction;
	ListView vChildren;
	final Client kinvey=new Client.Builder(this).build();
	/** Called when the activity is first created. */
	public void onCreate(Bundle savedInstanceState) {
		super.onCreate(savedInstanceState);
		defaultChildAction=(LoaderActionBarItem)this.getActionBar().newActionBarItem(LoaderActionBarItem.class);
		this.addActionBarItem(defaultChildAction);
		showDefaultChild();
		
		ToolBar footer=ToolBar.inflate(this);
		footer.setMaxItemCount(3);
		footer.addItem(Type.Share);
		footer.addItem(Type.Compass);//favorites
		footer.addItem(Type.AllFriends);//tasks
		
		footer.setOnActionBarListener(new OnActionBarListener(){

			@Override
			public void onActionBarItemClicked(int position) {
				Intent intent;
				switch(position){
				case 1:
					intent=new Intent(Main.this,ShowFavorites.class);
					Main.this.startActivity(intent);
				break;
				case 2:
					intent=new Intent(Main.this,ShowTasks.class);
					Main.this.startActivity(intent);
				break;
				}
				
			}
			
		});
		
		this.getActionBar().setOnActionBarListener(new OnActionBarListener(){

			@Override
			public void onActionBarItemClicked(int position) {
				switch(position){
				case OnActionBarListener.HOME_ITEM:
					break;
				case 0:
					defaultChildAction.setLoading(false);
					if(!kinvey.user().isUserLoggedIn()){
						Intent intent=new Intent(Main.this,UserAccount.class);
						intent.putExtra("type", UserAccount.Type.Signin.name());
						Main.this.startActivityForResult(intent, SIGNIN);
						break;
					}else
						childrenWindow.showAsDropDown(getActionBar().getItem(position).getItemView());
					break;
				}
			}
			
		});
		
		try {
			setListAdapter(ItemAdapter.createFromXml(this, R.xml.category));
		} catch (Exception e) {
			e.printStackTrace();
		}
		
		createChildrenWindow();
	}

	protected void setDefaultChild(Entity child) {
		String defaultChildId=DB.getInstance(this).get("DefaultChild");
		if(child.id.equals(defaultChildId))
			return;
		DB.getInstance(this).set("DefaultChild", child.id);
		showDefaultChild();
	}
	
	private boolean isDefaultChild(Entity child){
		String defaultChildId=DB.getInstance(this).get("DefaultChild");
		if(defaultChildId==null ||defaultChildId.length()==0){
			defaultChildId=child.id;
			DB.getInstance(this).set("DefaultChild",defaultChildId);
			return true;
		}
		return defaultChildId.equals(child.id);
	}
	
	protected void showDefaultChild(){
		if(!kinvey.user().isUserLoggedIn()){
			defaultChildAction.setDrawable(android.R.drawable.ic_secure);
			return;
		}
		defaultChildAction.setLoading(true);
		String id=DB.getInstance(this).get("DefaultChild");
		AsyncAppData<Child> children=kinvey.appData("Child", Child.class);
		children.setOffline(OfflinePolicy.ONLINE_FIRST, new SqlLiteOfflineStore<Child>(this));
		Query query=kinvey.query();

		if(id!=null && id.length()!=0)
			query.equals("_id", id);
		else
			query.equals("parent", kinvey.user().getId());
		query.setLimit(1);
		children.get(query,new KinveyListCallback<Child>(){
			/*
			public void done(Entity child, ParseException ex) {
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
			*/
			@Override
			public void onFailure(Throwable throwable) {
				defaultChildAction.setLoading(false);
				
			}

			@Override
			public void onSuccess(Child[] children) {
				defaultChildAction.setLoading(false);
				defaultChildAction.setDrawable(R.drawable.gd_action_bar_all_friends);
				if(children==null || children.length==0){
					defaultChildAction.setDrawable(R.drawable.gd_action_bar_add);
					return;
				}
				Child child=children[0];
				if(child.containsKey("photo")){
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
		intent.putExtra("type", this.getResources().getStringArray(R.array.categories)[position]);
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
	
	private PopupWindow childrenWindow;
	private void refreshChildrenWindow(){
		if(!kinvey.user().isUserLoggedIn())
			return;
		
		QueryAdapter<Entity> adapter=new QueryAdapter<Entity>(this,new QueryFactory<Entity>(){
			@Override
			public ParseQuery<Entity> create() {
				Query<Entity> query=new Query<Entity>("child");
				query.whereEqualTo("parent", ParseUser.getCurrentUser());
				query.setCachePolicy(CachePolicy.CACHE_ONLY);
				return query;
			}
		}){
			@Override
			public View getItemView(Entity object, View v, ViewGroup parent) {
				LinearLayout view=(LinearLayout)super.getItemView(object, v, parent);
				if(this.getCount()>1)
					view.setSelected(isDefaultChild(object));
			
				return view;
			}
		};
		adapter.setPlaceholder(getResources().getDrawable(android.R.drawable.ic_menu_camera));
		adapter.setImageKey("photo");
		adapter.setTextKey("__notexist");//hack to set non-existence key so there's no text
		vChildren.setAdapter(adapter);
	}
	
	private PopupWindow createChildrenWindow(){
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
					setDefaultChild((Entity)view.getTag());
				}
				
			});
			
			vChildren.setOnLongClickListener(new OnLongClickListener(){

				@Override
				public boolean onLongClick(View view) {//edit
					Intent intent=new Intent(Main.this,CreateChild.class);
					intent.putExtra("id", ((Entity)view.getTag()).id);
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
