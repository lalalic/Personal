package com.supernaiba.ui;

import greendroid.app.GDActivity;
import greendroid.widget.ActionBar.OnActionBarListener;
import greendroid.widget.ActionBarItem;
import greendroid.widget.ActionBarItem.Type;
import greendroid.widget.ToolBar;
import android.annotation.TargetApi;
import android.app.Activity;
import android.content.Context;
import android.content.Intent;
import android.graphics.drawable.BitmapDrawable;
import android.os.Bundle;
import android.provider.MediaStore;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.LinearLayout;
import android.widget.ListView;
import android.widget.PopupWindow;

import com.parse.GetCallback;
import com.parse.Magic;
import com.parse.ParseAnalytics;
import com.parse.ParseException;
import com.parse.ParseObject;
import com.parse.ParseQuery;
import com.parse.ParseQueryAdapter.QueryFactory;
import com.parse.SaveCallback;
import com.supernaiba.R;
import com.supernaiba.parse.QueryAdapter;
import com.supernaiba.widget.PostEditor;

public class CreatePost extends GDActivity {
	private static final int NEW_PHOTO = 0;
	private PostEditor vEditor;
	
	private ParseObject post;
	private String type;
	private ActionBarItem tagAction;
	
	/** Called when the activity is first created. */
	public void onCreate(Bundle savedInstanceState) {
		super.onCreate(savedInstanceState);
		this.setActionBarContentView(R.layout.create);
		ParseAnalytics.trackAppOpened(getIntent());
		Intent intent=getIntent();
		type=intent.getStringExtra("type");
		if(intent.hasExtra("id")){
			post=ParseObject.createWithoutData("post", intent.getStringExtra("id"));
		}else{
			post=new ParseObject("post");
			this.setTitle(getString(R.string.creating)+" "+type);
		}
		post.put("category", type);
		
		this.vEditor=(PostEditor)this.findViewById(R.id.editor);
		vEditor.setTitle(null);
		
		this.addActionBarItem(Type.Export);
		
		
		ToolBar footer=ToolBar.inflate(this);
		footer.setMaxItemCount(3);
		footer.addItem(Type.TakePhoto);
		footer.addItem(Type.Eye);
		tagAction=footer.addItem(Type.Settings);
		
		
		
		footer.setOnActionBarListener(new OnActionBarListener(){

			@Override
			public void onActionBarItemClicked(int position) {
				switch(position){
				case 0:
					takePhoto();
					break;	
				case 2:
					tagWindow.showAsDropDown(tagAction.getItemView());
					break;
				}
			}
			
		});
		
		this.getActionBar().setOnActionBarListener(new OnActionBarListener(){

			@Override
			public void onActionBarItemClicked(int position) {
				switch(position){
				case OnActionBarListener.HOME_ITEM:
					onBackPressed();
					break;
				case 0:
					post.put("title", vEditor.getTitle());
					post.put("content", vEditor.getHTML(null));
					String thumbnail=vEditor.getFirstImageUrl();
					if(thumbnail!=null)
						post.put("thumbnail", Magic.createWithDate("a.jpg", thumbnail));
					post.saveInBackground(new SaveCallback(){
						@Override
						public void done(ParseException ex) {
							if(ex!=null)
								post.saveEventually();
						}
						
					});
					finish();
					break;
				default:
					
				break;
				}
				
			}
			
		});
		createTagWindow();
	}
	
	public void refresh(){
		if(post.getObjectId()==null)
			return;
		post.fetchInBackground(new GetCallback<ParseObject>(){
			@Override
			public void done(ParseObject post, ParseException ex) {
				vEditor.setTitle(post.getString("title"));
				vEditor.setText(post.getString("content"));
			}
		});
	}
	
	public void takePhoto() {
		Intent pick = new Intent(Intent.ACTION_GET_CONTENT);
		pick.setType("image/*");

		Intent photo = new Intent(MediaStore.ACTION_IMAGE_CAPTURE);
		Intent chooserIntent = Intent.createChooser(pick, this.getString(R.string.make_photo));
		chooserIntent.putExtra(Intent.EXTRA_INITIAL_INTENTS,
				new Intent[] { photo });
		this.startActivityForResult(chooserIntent, NEW_PHOTO);
	}
	
	@TargetApi(5)
	@Override
	protected void onActivityResult(int requestCode, int resultCode, Intent data) {
		if(resultCode==Activity.RESULT_CANCELED){
			super.onActivityResult(requestCode, resultCode, data);
			return;
		}
		switch(requestCode){
		case NEW_PHOTO:
			vEditor.insertImage(data.getData());
			break;
		default:
			super.onActivityResult(requestCode, resultCode, data);
		}
	}
	
	private PopupWindow tagWindow;
	@SuppressWarnings("static-access")
	protected void createTagWindow(){
		if(tagWindow==null){
			LayoutInflater inflater=(LayoutInflater)this.getSystemService(Context.LAYOUT_INFLATER_SERVICE);
			View view=inflater.inflate(R.layout.tags, null);
			ListView list=(ListView)view.findViewById(R.id.lists);
			tagWindow=new PopupWindow(view,view.getLayoutParams().MATCH_PARENT,view.getLayoutParams().WRAP_CONTENT);
			QueryAdapter<ParseObject> adapter=new QueryAdapter<ParseObject>(this,new QueryFactory<ParseObject>(){
				@Override
				public ParseQuery<ParseObject> create() {
					ParseQuery<ParseObject> query=new ParseQuery<ParseObject>("tag");

					return query;
				}
				
			}){
				@Override
				public View getItemView(ParseObject object, View v, ViewGroup parent) {
					LinearLayout view=(LinearLayout)super.getItemView(object, v, parent);
					
					return view;
				}
			};
			adapter.setTextKey("name");
			list.setAdapter(adapter);
		}
		tagWindow.setFocusable(true);
		tagWindow.setOutsideTouchable(true);
		tagWindow.setBackgroundDrawable(new BitmapDrawable()); 
	}

}

