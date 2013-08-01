package com.supernaiba.ui;

import greendroid.app.GDActivity;
import greendroid.widget.ActionBar.OnActionBarListener;
import greendroid.widget.ActionBarItem.Type;
import greendroid.widget.ToolBar;

import java.util.Arrays;
import java.util.List;

import android.annotation.TargetApi;
import android.app.Activity;
import android.content.Context;
import android.content.Intent;
import android.graphics.drawable.BitmapDrawable;
import android.os.Bundle;
import android.provider.MediaStore;
import android.view.LayoutInflater;
import android.view.View;
import android.view.View.OnClickListener;
import android.view.ViewGroup;
import android.view.WindowManager;
import android.widget.CheckBox;
import android.widget.CompoundButton;
import android.widget.CompoundButton.OnCheckedChangeListener;
import android.widget.LinearLayout;
import android.widget.PopupWindow;
import android.widget.RadioButton;

import com.parse.Magic;
import com.parse.ParseAnalytics;
import com.parse.ParseException;
import com.parse.ParseObject;
import com.supernaiba.R;
import com.supernaiba.parse.OnGet;
import com.supernaiba.parse.OnSave;
import com.supernaiba.widget.PostEditor;

public class CreatePost extends GDActivity {
	private static final int NEW_PHOTO = 0;
	private PostEditor vEditor;
	
	private ParseObject post;
	private String type;
	
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
		
		
		final ToolBar footer=ToolBar.inflate(this);
		footer.setMaxItemCount(2);
		footer.addItem(Type.TakePhoto);
		footer.addItem(Type.List);
		
		
		
		footer.setOnActionBarListener(new OnActionBarListener(){

			@Override
			public void onActionBarItemClicked(int position) {
				switch(position){
				case 0:
					takePhoto();
					break;	
				case 1:
					getTagWindow().showAsDropDown(footer.getItem(position).getItemView());
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
						post.put("thumbnail", Magic.createWithUrl(thumbnail));
					post.saveInBackground(new OnSave(CreatePost.this,post){
						@Override
						public void done(ParseException ex) {
							super.done(ex);
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
	}
	
	public void refresh(){
		if(post.getObjectId()==null)
			return;
		post.fetchInBackground(new OnGet<ParseObject>(this){
			@Override
			public void done(ParseObject post, ParseException ex) {
				super.done(post, ex);
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
	protected PopupWindow getTagWindow(){
		if(tagWindow==null){
			LayoutInflater inflater=(LayoutInflater)this.getSystemService(Context.LAYOUT_INFLATER_SERVICE);
			View view=inflater.inflate(R.layout.tags, null);
			int screenWidth=((WindowManager)getSystemService(Context.WINDOW_SERVICE)).getDefaultDisplay().getWidth();
			tagWindow=new PopupWindow(view,screenWidth, LinearLayout.LayoutParams.WRAP_CONTENT,true);
			ViewGroup vGender=(ViewGroup)view.findViewById(R.id.gender);
			OnCheckedChangeListener listener;
			final CheckBox vBoy=((CheckBox)vGender.getChildAt(0));
			final CheckBox vGirl=((CheckBox)vGender.getChildAt(1));
			vBoy.setOnCheckedChangeListener(listener=new OnCheckedChangeListener(){
				@Override
				public void onCheckedChanged(CompoundButton checkBox,	boolean flag) {
					if(vBoy.isChecked())
						post.addUnique("gender", vBoy.getText());
					else if(vGirl.isChecked())
						post.addUnique("gender", vGirl.getText());
					else{
						post.addUnique("gender", vBoy.getText());
						post.addUnique("gender", vGirl.getText());
					}	
				}
				
			});
			vGirl.setOnCheckedChangeListener(listener);
			
			final ViewGroup vDuration=(ViewGroup)view.findViewById(R.id.duration);
			final RadioButton vD1=(RadioButton)vDuration.getChildAt(0);
			OnClickListener durationListener;
			vD1.setOnClickListener(durationListener=new OnClickListener(){

				@Override
				public void onClick(View view) {
					for(int i=0,size=vDuration.getChildCount()-1;i<size;i++)
						((RadioButton)vDuration.getChildAt(i)).setChecked(false);
					((RadioButton)view).setChecked(true);
					post.put("duration", ((RadioButton)view).getText());
				}
				
				
			});
			for(int i=1,size=vDuration.getChildCount()-1;i<size;i++)
				((RadioButton)vDuration.getChildAt(i)).setOnClickListener(durationListener);
			
			ViewGroup vGoal=(ViewGroup)view.findViewById(R.id.goal);
			final CheckBox vGoal1=((CheckBox)vGoal.getChildAt(0));
			vGoal1.setOnCheckedChangeListener(listener=new OnCheckedChangeListener(){

				@Override
				public void onCheckedChanged(CompoundButton checkbox, boolean checked) {
					if(checked)
						post.addUnique("goal", checkbox.getText());
					else
						post.removeAll("goal", Arrays.asList(checkbox.getText()));
				}
				
			});
			for(int i=1,size=vGoal.getChildCount();i<size;i++)
				((CheckBox)vGoal.getChildAt(i)).setOnCheckedChangeListener(listener);
			
		}
		tagWindow.setFocusable(true);
		tagWindow.setOutsideTouchable(true);
		tagWindow.setBackgroundDrawable(new BitmapDrawable()); 
		refreshSettings();
		return tagWindow;
	}

	private void refreshSettings() {
		if(post.containsKey("gender")){
			List<String> genders=post.getList("gender");
			ViewGroup vGender=(ViewGroup)tagWindow.getContentView().findViewById(R.id.gender);
			for(int i=0, size=vGender.getChildCount(); i<size; i++){
				CheckBox current=(CheckBox)vGender.getChildAt(i);
				if(genders.contains(current.getText()))
					current.setChecked(true);
			}
		}
		if(post.containsKey("duration")){
			int duration=post.getInt("duration");
			ViewGroup vDuration=(ViewGroup)tagWindow.getContentView().findViewById(R.id.goal);
			for(int i=0,size=vDuration.getChildCount()-1;i<size;i++)
				((RadioButton)vDuration.getChildAt(i)).setOnCheckedChangeListener(new OnCheckedChangeListener(){

					@Override
					public void onCheckedChanged(CompoundButton radio,
							boolean flag) {
						if(flag)
							post.put("duration", radio.getText());
					}
				
				});
		}
		if(post.containsKey("goal")){
			List<String> genders=post.getList("goal");
			ViewGroup vGoal=(ViewGroup)tagWindow.getContentView().findViewById(R.id.goal);
			for(int i=0, size=vGoal.getChildCount(); i<size; i++){
				CheckBox current=(CheckBox)vGoal.getChildAt(i);
				if(genders.contains(current.getText()))
					current.setChecked(true);
			}
		}
	}
}

