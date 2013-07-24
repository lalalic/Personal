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

import com.parse.GetCallback;
import com.parse.Magic;
import com.parse.ParseAnalytics;
import com.parse.ParseException;
import com.parse.ParseObject;
import com.parse.SaveCallback;
import com.supernaiba.R;
import com.supernaiba.widget.PostEditor;

public class CreateStory extends GDActivity {
	private static final int NEW_PHOTO = 0;
	private PostEditor vEditor;
	
	private ParseObject story;
	
	/** Called when the activity is first created. */
	public void onCreate(Bundle savedInstanceState) {
		super.onCreate(savedInstanceState);
		this.setActionBarContentView(R.layout.create);
		ParseAnalytics.trackAppOpened(getIntent());
		Intent intent=getIntent();
		story=new ParseObject("story");
		
		if(intent.hasExtra("ID"))
			story.setObjectId(intent.getStringExtra("ID"));
		
		if(intent.hasExtra("parent"))
			story.put("parent", ParseObject.createWithoutData("post", intent.getStringExtra("parent")));
		
		this.vEditor=(PostEditor)this.findViewById(R.id.editor);
		
		this.addActionBarItem(Type.Export);
		
		
		ToolBar footer=ToolBar.inflate(this);
		footer.setMaxItemCount(3);
		footer.addItem(Type.TakePhoto);
		footer.addItem(Type.Eye);
		
		
		
		footer.setOnActionBarListener(new OnActionBarListener(){

			@Override
			public void onActionBarItemClicked(int position) {
				switch(position){
				case 0:
					takePhoto();
					break;	
				case 2:
					
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
					story.put("content", vEditor.getHTML(null));
					String thumbnail=vEditor.getFirstImageUrl();
					if(thumbnail!=null)
						story.put("thumbnail", Magic.createWithUrl(thumbnail));
					story.saveInBackground(new SaveCallback(){
						@Override
						public void done(ParseException ex) {
							if(ex!=null)
								story.saveEventually();
						}
						
					});
					finish();
					break;
				default:
					
				break;
				}
				
			}
			
		});
	}
	
	public void refresh(){
		if(story.getObjectId()==null)
			return;
		story.fetchInBackground(new GetCallback<ParseObject>(){
			@Override
			public void done(ParseObject post, ParseException ex) {
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

