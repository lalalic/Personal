package com.supernaiba.ui;

import greendroid.widget.ActionBarItem.Type;
import android.content.Intent;

import com.parse.Magic;
import com.parse.ParseException;
import com.parse.ParseObject;
import com.parse.ParseUser;
import com.supernaiba.R;
import com.supernaiba.parse.OnGet;
import com.supernaiba.parse.OnSave;
import com.supernaiba.widget.PostEditor;

public class CreateStory extends CreatePost {
	@Override
	protected void createFooterBarItem(){
		createFooterBar(Type.TakePhoto);
	}
	
	@Override
	protected ParseObject extract(){
		Intent intent=getIntent();
		obj=new ParseObject("story");
		
		if(intent.hasExtra("ID")){
			obj.setObjectId(intent.getStringExtra("ID"));
			populate();
		}else if(intent.hasExtra("parent"))
			obj.put("parent", ParseObject.createWithoutData("post", intent.getStringExtra("parent")));
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
				vEditor.setText("<div>"+p.getString("content")+"</div>");
			}
		});
	}

	@Override
	protected Intent save() {
		obj.put("author", ParseUser.getCurrentUser());
		obj.put("content", vEditor.getHTML());
		String thumbnail=vEditor.getFirstImageUrl();
		if(thumbnail!=null)
			obj.put("thumbnail", Magic.createWithUrl(thumbnail));
		obj.saveInBackground(new OnSave(this,obj){
			@Override
			public void done(ParseException ex) {
				super.done(ex);
				if(ex!=null)
					obj.saveEventually();
			}
			
		});
		return null;
	}
}

