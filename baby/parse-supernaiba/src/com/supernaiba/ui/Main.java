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

import com.parse.GetCallback;
import com.parse.GetDataCallback;
import com.parse.ParseAnalytics;
import com.parse.ParseAnonymousUtils;
import com.parse.ParseException;
import com.parse.ParseObject;
import com.parse.ParseQuery;
import com.parse.ParseQueryAdapter.QueryFactory;
import com.parse.ParseUser;
import com.supernaiba.R;
import com.supernaiba.data.DB;
import com.supernaiba.parse.QueryAdapter;

public class Main extends GDListActivity {
	private final static int CHILD=0;
	private final static int SIGNIN=1;
	
	QuickActionBar childrenBar=null;
	LoaderActionBarItem defaultChildAction;
	/** Called when the activity is first created. */
	public void onCreate(Bundle savedInstanceState) {
		super.onCreate(savedInstanceState);
		ParseAnalytics.trackAppOpened(getIntent());
		
		this.addActionBarItem(Type.Search);
		defaultChildAction=(LoaderActionBarItem)this.getActionBar().newActionBarItem(LoaderActionBarItem.class);
		this.addActionBarItem(defaultChildAction);
		showDefaultChild();
		
		ToolBar footer=ToolBar.inflate(this);
		footer.setMaxItemCount(3);
		footer.addItem(Type.Share);
		footer.addItem(Type.Compass);
		footer.addItem(Type.AllFriends);
		
		footer.setOnActionBarListener(new OnActionBarListener(){

			@Override
			public void onActionBarItemClicked(int position) {
				switch(position){
				case 2:
				default:
					Intent intent=new Intent(Main.this,ShowTasks.class);
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
				case 1:
					defaultChildAction.setLoading(false);
					if(ParseAnonymousUtils.isLinked(ParseUser.getCurrentUser())){
						Intent intent=new Intent(Main.this,UserAccount.class);
						intent.putExtra("type", UserAccount.Type.Signin.name());
						Main.this.startActivityForResult(intent, SIGNIN);
						break;
					}else
						childrenWindow.showAsDropDown(getActionBar().getItem(position).getItemView());
					break;
				case 0:
					onSearchRequested();
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

	protected void setDefaultChild(ParseObject child) {
		String defaultChildId=DB.getInstance(this).get("DefaultChild");
		if(child.getObjectId().equals(defaultChildId))
			return;
		DB.getInstance(this).set("DefaultChild", child.getObjectId());
		showDefaultChild();
	}
	
	private boolean isDefaultChild(ParseObject child){
		String defaultChildId=DB.getInstance(this).get("DefaultChild");
		if(defaultChildId==null ||defaultChildId.length()==0){
			defaultChildId=child.getObjectId();
			DB.getInstance(this).set("DefaultChild",defaultChildId);
			return true;
		}
		return defaultChildId.equals(child.getObjectId());
	}
	
	protected void showDefaultChild(){
		if(ParseAnonymousUtils.isLinked(ParseUser.getCurrentUser()))
			defaultChildAction.setDrawable(android.R.drawable.ic_secure);
		defaultChildAction.setLoading(true);
		String id=DB.getInstance(this).get("DefaultChild");
		ParseQuery<ParseObject> children=new ParseQuery<ParseObject>("child");
		if(id!=null && id.length()!=0)
			children.whereEqualTo("objectId", id);
		else
			children.whereEqualTo("parent", ParseUser.getCurrentUser());
		children.getFirstInBackground(new GetCallback<ParseObject>(){
			@Override
			public void done(ParseObject child, ParseException ex) {
				defaultChildAction.setLoading(false);
				if(ex!=null)
					defaultChildAction.setDrawable(R.drawable.gd_action_bar_all_friends);
				else if(child==null)
					defaultChildAction.setDrawable(R.drawable.gd_action_bar_add);
				else if(child.containsKey("photo")){
					defaultChildAction.setLoading(true);
					child.getParseFile("photo").getDataInBackground(new GetDataCallback(){

						@Override
						public void done(byte[] data, ParseException ex) {
							if(data!=null)
								defaultChildAction.setDrawable(Drawable.createFromStream(new ByteArrayInputStream(data), null));
							else
								defaultChildAction.setDrawable(R.drawable.gd_action_bar_all_friends);
							defaultChildAction.setLoading(false);
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
			break;
		case SIGNIN:
			showDefaultChild();
			break;
		}
	}	
	
	private PopupWindow childrenWindow;
	private PopupWindow createChildrenWindow(){
		if(childrenWindow==null){
			LayoutInflater inflater=(LayoutInflater)this.getSystemService(Context.LAYOUT_INFLATER_SERVICE);
			View view=inflater.inflate(R.layout.children, null);
			ListView vChildren=(ListView)view.findViewById(R.id.children);
			View vCreateChild=view.findViewById(R.id.createChild);
			int width=(int)getResources().getDimension(R.dimen.gd_action_bar_height);
			childrenWindow=new PopupWindow(view,width,width*4);
			QueryAdapter<ParseObject> adapter=new QueryAdapter<ParseObject>(this,new QueryFactory<ParseObject>(){
				@Override
				public ParseQuery<ParseObject> create() {
					ParseQuery<ParseObject> query=new ParseQuery<ParseObject>("child");
					query.whereEqualTo("parent", ParseUser.getCurrentUser());
					return query;
				}
				
			}){
				@Override
				public View getItemView(ParseObject object, View v, ViewGroup parent) {
					LinearLayout view=(LinearLayout)super.getItemView(object, v, parent);
					if(this.getCount()>1)
						view.setSelected(isDefaultChild(object));
					return view;
				}
			};
			adapter.setPlaceholder(getResources().getDrawable(android.R.drawable.ic_menu_camera));
			adapter.setImageKey("photo");
			vChildren.setAdapter(adapter);
			
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
		}
		childrenWindow.setFocusable(true);
		childrenWindow.setOutsideTouchable(true);
		childrenWindow.setBackgroundDrawable(new BitmapDrawable()); 
		return childrenWindow;
	}
}
