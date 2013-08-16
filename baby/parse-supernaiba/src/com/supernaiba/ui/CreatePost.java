package com.supernaiba.ui;

import greendroid.widget.ActionBarItem;
import greendroid.widget.ActionBarItem.Type;

import java.util.Arrays;
import java.util.List;

import android.content.Context;
import android.content.Intent;
import android.graphics.drawable.BitmapDrawable;
import android.os.Bundle;
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
import com.parse.ParseException;
import com.parse.ParseObject;
import com.supernaiba.R;
import com.supernaiba.parse.OnGet;
import com.supernaiba.parse.OnSave;
import com.supernaiba.widget.PostEditor;

public class CreatePost extends BaseCreatorActivity {
	protected PostEditor vEditor;
	
	/** Called when the activity is first created. */
	public void onCreate(Bundle savedInstanceState) {
		layout=R.layout.create;
		autoSave=false;
		super.onCreate(savedInstanceState);
	}
	
	@Override
	protected void creatActionBarItem(){
		addActionBarItem(Type.Export);
	}
	
	@Override
	protected void createFooterBarItem(){
		createFooterBar(Type.TakePhoto, Type.List);
	}
	
	@Override
	protected ParseObject extract(){
		Intent intent=getIntent();
		obj=new ParseObject("post");
		obj.put("category", intent.getStringExtra("type"));
		if(intent.hasExtra("id"))
			obj.setObjectId(intent.getStringExtra("id"));
		else
			setTitle(getString(R.string.creating)+" "+obj.getString("category"));
		return obj;
	}
	
	@Override
	protected void populate(){
		vEditor=(PostEditor)this.findViewById(R.id.editor);
		obj.fetchInBackground(new OnGet<ParseObject>(this){
			public void done(ParseObject p, ParseException ex) {
				super.done(p, ex);
				if(p==null)
					return;
				setTitle(p.getString("title"));
				vEditor.setText("<div>"+p.getString("content")+"</div>");
			}
		});
	}

	@Override
	protected Intent save() {
		obj.put("title", vEditor.getTitle());
		obj.put("content", vEditor.getHTML());
		String thumbnail=vEditor.getFirstImageUrl();
		if(thumbnail!=null)
			obj.put("thumbnail", Magic.createWithUrl(thumbnail));
		obj.saveInBackground(new OnSave(CreatePost.this,obj){
			@Override
			public void done(ParseException ex) {
				super.done(ex);
				if(ex!=null)
					obj.saveEventually();
			}
			
		});
		return null;
	}

	@Override
	public void onHandleFooterBarItemClick(ActionBarItem item, int position) {
		switch(item.getItemId()){	
		case R.drawable.gd_action_bar_list:
			getTagWindow().showAsDropDown(item.getItemView());
			return;
		}
		super.onHandleFooterBarItemClick(item, position);
	}
	
	@Override
	protected void onPhoto(Intent data){
		vEditor.insertImage(data.getData());
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
						obj.addUnique("gender", vBoy.getTag());
					else if(vGirl.isChecked())
						obj.addUnique("gender", vGirl.getTag());
					else{
						obj.addUnique("gender", vBoy.getTag());
						obj.addUnique("gender", vGirl.getTag());
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
					obj.put("duration", ((RadioButton)view).getTag());
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
						obj.addUnique("goal", checkbox.getTag());
					else
						obj.removeAll("goal", Arrays.asList(checkbox.getTag()));
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
		if(obj.containsKey("gender")){
			List<String> genders=obj.getList("gender");
			ViewGroup vGender=(ViewGroup)tagWindow.getContentView().findViewById(R.id.gender);
			for(int i=0, size=vGender.getChildCount(); i<size; i++){
				CheckBox current=(CheckBox)vGender.getChildAt(i);
				if(genders.contains(current.getTag()))
					current.setChecked(true);
			}
		}
		if(obj.containsKey("duration")){
			int duration=obj.getInt("duration");
			ViewGroup vDuration=(ViewGroup)tagWindow.getContentView().findViewById(R.id.goal);
			for(int i=0,size=vDuration.getChildCount()-1;i<size;i++){
				RadioButton rb=(RadioButton)vDuration.getChildAt(i);
				rb.setChecked(Integer.valueOf(duration).equals(rb.getTag()));
			}
		}
		if(obj.containsKey("goal")){
			List<String> genders=obj.getList("goal");
			ViewGroup vGoal=(ViewGroup)tagWindow.getContentView().findViewById(R.id.goal);
			for(int i=0, size=vGoal.getChildCount(); i<size; i++){
				CheckBox current=(CheckBox)vGoal.getChildAt(i);
				if(genders.contains(current.getTag()))
					current.setChecked(true);
			}
		}
	}
}

