package com.supernaiba.ui;

import greendroid.widget.ActionBarItem;
import greendroid.widget.AsyncImageView;
import android.content.Intent;
import android.graphics.Bitmap;
import android.os.Bundle;
import android.view.View;
import android.view.View.OnClickListener;
import android.widget.DatePicker;
import android.widget.EditText;
import android.widget.Spinner;

import com.parse.ParseException;
import com.parse.ParseFile;
import com.parse.ParseObject;
import com.parse.ParseUser;
import com.supernaiba.R;
import com.supernaiba.parse.OnGet;
import com.supernaiba.parse.OnSave;
import com.supernaiba.util.Photo;

public class CreateChild extends BaseCreatorActivity {
	final static int TYPE_ADD=0;
	final static int TYPE_EDIT=1;
	final static int TYPE_REMOVE=2;
	
	
	private AsyncImageView vPhoto;
	private EditText vUserName;
	private Spinner vGender;
	private DatePicker vBirthday;	
	
	private ParseObject obj;
	
	private int type;
	/** Called when the activity is first created. */
	public void onCreate(Bundle savedInstanceState) {
		layout=R.layout.child;
		title=R.string.createChild;
		super.onCreate(savedInstanceState);
	}

	@Override
	public void onHandleFooterBarItemClick(ActionBarItem item, int position) {
		switch(item.getItemId()){
		case R.drawable.gd_action_bar_trashcan:
			Intent returnIntent = new Intent();
			returnIntent.putExtra("type", TYPE_REMOVE);
			setResult(RESULT_OK, returnIntent);
			finish();
			return;
		}
		super.onHandleFooterBarItemClick(item, position);
	}

	@Override
	protected ParseObject extract(){
		obj=new ParseObject("child");
		String id=getIntent().getStringExtra("id");
		if(id==null){
			obj.put("parent", ParseUser.getCurrentUser());
			type=TYPE_ADD;
		}else{
			obj.setObjectId(id);
			type=TYPE_EDIT;
		}
		return obj;
	}
	
	@Override
	protected void populate() {
		vUserName=(EditText)findViewById(R.id.username);
		vGender=(Spinner)findViewById(R.id.gender);
		vBirthday=(DatePicker)findViewById(R.id.birthday);
		vPhoto=(AsyncImageView)findViewById(R.id.photo);
		vPhoto.setOnClickListener(new OnClickListener(){
			@Override
			public void onClick(View view) {
				Photo.takePhoto(CreateChild.this);
			}
			
		});
		
		obj.fetchInBackground(new OnGet<ParseObject>(this){
			@Override
			public void done(ParseObject o, ParseException ex) {
				if(o==null)
					return;
				vUserName.setText(o.getString("name"));
				vGender.setSelection(o.getInt("gender"));
				String birthday=o.getString("birdth");
				if(birthday!=null){
					String d[]=birthday.split("-");
					vBirthday.updateDate(Integer.parseInt(d[0]),Integer.parseInt(d[1])-1,Integer.parseInt(d[2])-1);
				}
				if(o.containsKey("photo")){
					ParseFile photo=(ParseFile)o.get("photo");
					vPhoto.setUrl(photo.getUrl());
				}
			}
		});
	}

	@Override
	protected Intent save(){
		obj.put("name", vUserName.getText().toString());
		if(obj.getString("name").length()==0)
			return null;
		obj.put("gender", vGender.getSelectedItemPosition());
		obj.put("birthday", vBirthday.getYear()+"-"+(vBirthday.getMonth()+1)+"-"+(vBirthday.getDayOfMonth()+1));
		Intent returnIntent = new Intent();
		if(obj.containsKey("photo")){
			ParseFile photo=obj.getParseFile("photo");
			if(photo.isDirty()){
				try {
					returnIntent.putExtra("photo", photo.getData());
				} catch (ParseException e) {
					
				}
				
				photo.saveInBackground(new OnSave(this,photo){
					@Override
					public void done(ParseException ex) {
						super.done(ex);
						obj.saveEventually();
					}
				});
			}
		}
		returnIntent.putExtra("name", obj.getString("name"));
		returnIntent.putExtra("type", type);
		return returnIntent;
	}
	
	@Override
	protected void onPhoto(Intent data){
		Bitmap bm=Photo.getBitmap(this, data);
		ParseFile photo=new ParseFile("a.jpg",Photo.getBytes(bm));
		obj.put("photo", photo);
		vPhoto.setImageBitmap(bm);
	}
}
