package com.supernaiba.ui;

import greendroid.app.GDListActivity;
import greendroid.widget.ActionBar.OnActionBarListener;
import greendroid.widget.ActionBarItem.Type;
import greendroid.widget.ItemAdapter;
import greendroid.widget.QuickAction;
import greendroid.widget.QuickActionBar;
import greendroid.widget.QuickActionWidget;
import greendroid.widget.QuickActionWidget.OnQuickActionClickListener;
import greendroid.widget.ToolBar;

import java.io.ByteArrayInputStream;
import java.util.List;

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

import com.parse.FindCallback;
import com.parse.GetDataCallback;
import com.parse.ParseAnalytics;
import com.parse.ParseAnonymousUtils;
import com.parse.ParseException;
import com.parse.ParseFile;
import com.parse.ParseObject;
import com.parse.ParseQuery;
import com.parse.ParseQueryAdapter;
import com.parse.ParseUser;
import com.supernaiba.R;
import com.supernaiba.data.DB;

public class Main extends GDListActivity {
	private final static int CHILD=0;
	private final static int SIGNIN=1;
	
	QuickActionBar childrenBar=null;
	List<ParseObject> children=null;
	/** Called when the activity is first created. */
	public void onCreate(Bundle savedInstanceState) {
		super.onCreate(savedInstanceState);
		ParseAnalytics.trackAppOpened(getIntent());
		
		this.addActionBarItem(Type.Search);
		this.addActionBarItem(Type.AllFriends);

		
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
					if(ParseAnonymousUtils.isLinked(ParseUser.getCurrentUser())){
						Intent intent=new Intent(Main.this,UserAccount.class);
						intent.putExtra("type", UserAccount.Type.Signin.name());
						Main.this.startActivityForResult(intent, SIGNIN);
						break;
					}else{
						//Main.this.getQuickActionBar().show(Main.this.getActionBar().getItem(position).getItemView());
						childrenWindow.showAsDropDown(getActionBar().getItem(position).getItemView());
					}
					break;
				case 0:
					Main.this.onSearchRequested();
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
	
	protected QuickActionBar getQuickActionBar(){
		if(childrenBar!=null)
			return childrenBar;
		childrenBar=new QuickActionBar(this);
		childrenBar.setWidth(childrenBar.getWidth());
		childrenBar.addQuickAction(new QuickAction(this,R.drawable.gd_action_bar_add,R.string.createChild));		
		childrenBar.setOnQuickActionClickListener(new OnQuickActionClickListener(){
			@Override
			public void onQuickActionClicked(QuickActionWidget widget,
					int position) {
				Intent intent=new Intent(Main.this,CreateChild.class);
				switch(position){
				case 0:	//create
					break;
				default:
					Main.this.setDefaultChild(Main.this.children.get(position-1));
					break;
				}
				Main.this.startActivityForResult(intent, CHILD);
				
			}
			
		});
		this.popupChildren();
		return childrenBar;
	}

	protected void setDefaultChild(ParseObject child) {
		DB.getInstance(this).set("DefaultChild", child.getObjectId());
	}
	
	protected ParseObject getDefaultChild(){
		ParseObject child=this.children.get(0);
		String id=DB.getInstance(this).get("DefaultChild");
		if(id!=null){
			child=ParseObject.createWithoutData(ParseObject.class, id);
			try {
				child.fetch();
			} catch (ParseException e) {
				
			}
		}
		return child;
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
			switch(data.getIntExtra("type", CreateChild.TYPE_ADD)){
			case CreateChild.TYPE_ADD:
				
				byte[] photoData=data.getByteArrayExtra("photo");
				if(photoData!=null){
					getQuickActionBar()
					.addQuickAction(
							new QuickAction(Drawable.createFromStream(new ByteArrayInputStream(photoData), ""),
									data.getStringExtra("name")));
				}
				break;
			case CreateChild.TYPE_EDIT:
				
				break;
			case CreateChild.TYPE_REMOVE:
				
				break;
			}
			break;
		case SIGNIN:
			refresh();
			break;
		}
	}
	
	protected void refresh(){
		this.childrenBar=null;
		popupChildren();
	}
	
	private void addChildToActionBar(final ParseObject child){
		final QuickAction qa=new QuickAction(null,child.getString("name"));
		getQuickActionBar().addQuickAction(qa);
		
		if(child.containsKey("photo")){
			((ParseFile)child.get("photo")).getDataInBackground(new GetDataCallback(){
				@Override
				public void done(byte[] data, ParseException ex) {
					qa.mDrawable=Drawable.createFromStream(new ByteArrayInputStream(data), null);
				}
			});
		}else
			qa.mDrawable=this.getResources().getDrawable(R.drawable.gd_action_bar_all_friends);
	}
	
	private void popupChildren(){
		if(ParseAnonymousUtils.isLinked(ParseUser.getCurrentUser()))
			return;
		ParseQuery<ParseObject> query = ParseQuery.getQuery("child");
		query.whereEqualTo("parent", ParseUser.getCurrentUser());
		 query.findInBackground(new FindCallback<ParseObject>() {
		     public void done(List<ParseObject> children, ParseException e) {
		    	 Main.this.children=children;
		    	 if(children==null)
		    		 return;
		    	 for(ParseObject child: children)
		    		 Main.this.addChildToActionBar(child);
		     }
		 });
	}	
	
	
	private PopupWindow childrenWindow;
	private PopupWindow createChildrenWindow(){
		if(childrenWindow==null){
			LayoutInflater inflater=(LayoutInflater)this.getSystemService(Context.LAYOUT_INFLATER_SERVICE);
			View view=inflater.inflate(R.layout.children, null);
			ListView vChildren=(ListView)view.findViewById(R.id.children);
			childrenWindow=new PopupWindow(view,50,200);
			ParseQueryAdapter<ParseObject> adapter=new ParseQueryAdapter<ParseObject>(this,"child"){
				@Override
				public View getItemView(ParseObject object, View v, ViewGroup parent) {
					View view=super.getItemView(object, v, parent);
					view.setTag(object);
					return view;
				}
			};
			adapter.setAutoload(true);
			adapter.setImageKey("photo");
			vChildren.setAdapter(adapter);
			view.findViewById(R.id.createChild).setOnClickListener(new OnClickListener(){
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
