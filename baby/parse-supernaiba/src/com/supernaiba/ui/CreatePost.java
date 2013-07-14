package com.supernaiba.ui;

import greendroid.app.GDActivity;
import greendroid.widget.ActionBar.OnActionBarListener;
import greendroid.widget.ActionBarItem.Type;
import greendroid.widget.ToolBar;
import android.annotation.TargetApi;
import android.app.Activity;
import android.content.Intent;
import android.os.Bundle;
import android.provider.MediaStore;
import android.widget.EditText;

import com.parse.GetCallback;
import com.parse.ParseAnalytics;
import com.parse.ParseException;
import com.parse.ParseObject;
import com.supernaiba.R;
import com.supernaiba.widget.PostEditor;

public class CreatePost extends GDActivity {
	private static final int NEW_PHOTO = 0;
	PostEditor vEditor;
	EditText vTitle;
	
	ParseObject post;
	String type;
	/** Called when the activity is first created. */
	public void onCreate(Bundle savedInstanceState) {
		super.onCreate(savedInstanceState);
		this.setActionBarContentView(R.layout.create);
		ParseAnalytics.trackAppOpened(getIntent());
		Intent intent=getIntent();
		type=intent.getStringExtra("type");
		if(intent.hasExtra("id")){
			post=ParseObject.createWithoutData(type, intent.getStringExtra("id"));
		}else{
			post=new ParseObject(type);
			this.setTitle(getString(R.string.creating)+" "+type);
		}
		
		this.vEditor=(PostEditor)this.findViewById(R.id.editor);
		this.vTitle=(EditText)this.findViewById(R.id.title);
		this.addActionBarItem(Type.Refresh);
		this.addActionBarItem(Type.Export);
		
		
		ToolBar footer=ToolBar.inflate(this);
		footer.setMaxItemCount(3);
		footer.addItem(Type.TakePhoto);
		footer.addItem(Type.Eye);
		footer.addItem(Type.Settings);
		
		
		
		footer.setOnActionBarListener(new OnActionBarListener(){

			@Override
			public void onActionBarItemClicked(int position) {
				switch(position){
				case 0:
					takePhoto();
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
					refresh();
					break;
				case 1:
					post.put("title", vTitle.getText().toString());
					post.put("content", vEditor.getText().toString());
					post.saveEventually();
					finish();
					break;
				default:
					
				break;
				}
				
			}
			
		});
		
	}
	
	public void refresh(){
		if(post.getObjectId()==null)
			return;
		post.fetchInBackground(new GetCallback<ParseObject>(){
			@Override
			public void done(ParseObject post, ParseException ex) {
				vTitle.setText(post.getString("title"));
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
	
	

}

