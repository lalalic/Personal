package com.supernaiba.ui;

import greendroid.app.GDActivity;
import greendroid.widget.ActionBar.OnActionBarListener;
import greendroid.widget.ActionBarItem.Type;
import greendroid.widget.ToolBar;

import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;

import android.annotation.TargetApi;
import android.app.Activity;
import android.content.Intent;
import android.graphics.Bitmap;
import android.graphics.Bitmap.CompressFormat;
import android.graphics.drawable.Drawable;
import android.os.Bundle;
import android.provider.MediaStore;
import android.view.View;
import android.view.View.OnClickListener;
import android.widget.DatePicker;
import android.widget.EditText;
import android.widget.ImageView;
import android.widget.Spinner;

import com.parse.GetDataCallback;
import com.parse.ParseAnalytics;
import com.parse.ParseException;
import com.parse.ParseFile;
import com.parse.ParseObject;
import com.parse.ParseQuery;
import com.parse.ParseUser;
import com.parse.SaveCallback;
import com.supernaiba.R;

public class CreateChild extends GDActivity {
	private static final int NEW_PHOTO = 0;
	
	final static int TYPE_ADD=0;
	final static int TYPE_EDIT=1;
	final static int TYPE_REMOVE=2;
	
	
	ImageView vPhoto;
	EditText vUserName;
	Spinner vGender;
	DatePicker vBirthday;	
	
	ParseObject child;
	
	int type;
	
	/** Called when the activity is first created. */
	public void onCreate(Bundle savedInstanceState) {
		super.onCreate(savedInstanceState);
		ParseAnalytics.trackAppOpened(getIntent());
		
		this.setActionBarContentView(R.layout.child);
		vUserName=(EditText)findViewById(R.id.username);
		vGender=(Spinner)findViewById(R.id.gender);
		vBirthday=(DatePicker)findViewById(R.id.birthday);
		vPhoto=(ImageView)findViewById(R.id.photo);
		
		this.setTitle(R.string.createChild);
		ToolBar footer=ToolBar.inflate(this);
		footer.setMaxItemCount(1);
		footer.addItem(Type.Trashcan);
		
		child=new ParseObject("child");
		String id=getIntent().getStringExtra("id");
		if(id==null){
			child.put("parent", ParseUser.getCurrentUser());
			type=TYPE_ADD;
		}else{
			type=TYPE_EDIT;
			child=getChild(getIntent().getStringExtra("id"));
		}
		show(child);
		
		footer.setOnActionBarListener(new OnActionBarListener(){

			@Override
			public void onActionBarItemClicked(int position) {
				switch(position){
				case 0:
					Intent returnIntent = new Intent();
					returnIntent.putExtra("type", TYPE_REMOVE);
					setResult(RESULT_OK, returnIntent);
					finish();
					break;
				case 1:
					
					break;
				}
			}
		});
		
		vPhoto.setOnClickListener(new OnClickListener(){

			@Override
			public void onClick(View view) {
				CreateChild.this.takePhoto();
			}
			
		});
	}

	private ParseObject getChild(String id){
		ParseQuery<ParseObject> query = ParseQuery.getQuery("Child");
		try {
			return query.get(id);
		} catch (ParseException e) {
			ParseObject b=new ParseObject("child");
			b.setObjectId(id);
			return b;
		}
	}

	protected void show(ParseObject child) {
		this.vUserName.setText(child.getString("name"));
		this.vGender.setSelection(child.getInt("gender"));
		String birthday=child.getString("birdth");
		if(birthday!=null){
			String d[]=birthday.split("-");
			this.vBirthday.updateDate(Integer.parseInt(d[0]),Integer.parseInt(d[1])-1,Integer.parseInt(d[2])-1);
		}
		if(child.containsKey("photo")){
			ParseFile photo=(ParseFile)child.get("photo");
			photo.getDataInBackground(new GetDataCallback(){
				@Override
				public void done(byte[] data, ParseException arg1) {
					CreateChild.this.vPhoto.setImageDrawable(Drawable.createFromStream(new ByteArrayInputStream(data), ""));
				}
			});
		}
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
			Bitmap bm= data.getExtras().containsKey("data") ? (Bitmap)data.getExtras().get("data") :
				MediaStore.Images.Thumbnails.getThumbnail(this.getContentResolver(), 
					Integer.parseInt(data.getData().getLastPathSegment()), 
					MediaStore.Images.Thumbnails.MICRO_KIND, 
					null);
			ByteArrayOutputStream os=new ByteArrayOutputStream();
			bm.compress(CompressFormat.JPEG, 80, os);
			byte[] photoData=os.toByteArray();
			ParseFile photo=new ParseFile("a.jpg",photoData);
			child.put("photo", photo);
			vPhoto.setImageBitmap(bm);
			break;
		default:
			super.onActivityResult(requestCode, resultCode, data);
		}
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

	
	@Override
	public void onBackPressed() {
		child.put("name", vUserName.getText().toString());
		child.put("gender", vGender.getSelectedItemPosition());
		child.put("birthday", vBirthday.getYear()+"-"+(vBirthday.getMonth()+1)+"-"+(vBirthday.getDayOfMonth()+1));
		Intent returnIntent = new Intent();
		if(child.containsKey("photo")){
			ParseFile photo=child.getParseFile("photo");
			if(photo.isDirty()){
				try {
					returnIntent.putExtra("photo", photo.getData());
				} catch (ParseException e) {
					
				}
				
				photo.saveInBackground(new SaveCallback(){
	
					@Override
					public void done(ParseException arg0) {
						child.saveEventually();
					}
					
				});
			}
		}
		returnIntent.putExtra("name", child.getString("name"));
		returnIntent.putExtra("type", type);
		setResult(RESULT_OK, returnIntent);
		finish();
		super.onBackPressed();
		
	}
}
