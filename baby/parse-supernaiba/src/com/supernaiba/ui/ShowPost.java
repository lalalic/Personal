package com.supernaiba.ui;

import greendroid.app.GDActivity;
import greendroid.widget.ActionBar.OnActionBarListener;
import greendroid.widget.ActionBarItem;
import greendroid.widget.ActionBarItem.Type;
import greendroid.widget.LoaderActionBarItem;
import greendroid.widget.ToolBar;

import java.util.Date;

import android.content.Context;
import android.content.Intent;
import android.graphics.Color;
import android.graphics.LightingColorFilter;
import android.graphics.drawable.BitmapDrawable;
import android.os.Bundle;
import android.text.Html;
import android.view.LayoutInflater;
import android.view.View;
import android.widget.PopupWindow;
import android.widget.RadioButton;
import android.widget.RadioGroup;
import android.widget.RadioGroup.OnCheckedChangeListener;
import android.widget.TextView;
import android.widget.Toast;

import com.parse.GetCallback;
import com.parse.ParseException;
import com.parse.ParseObject;
import com.parse.ParseQuery;
import com.parse.ParseUser;
import com.supernaiba.R;

public class ShowPost extends GDActivity {
	private String ID;
	private TextView vContent;
	private LoaderActionBarItem refreshAction;
	private ActionBarItem starAction,planAction;
	RadioGroup planTypes;
	private ParseObject post;
	/** Called when the activity is first created. */
	public void onCreate(Bundle savedInstanceState) {
		super.onCreate(savedInstanceState);
		
		this.setActionBarContentView(R.layout.post1);
		vContent=(TextView)findViewById(R.id.content);
		refreshAction=(LoaderActionBarItem)addActionBarItem(getActionBar().newActionBarItem(LoaderActionBarItem.class));
		refreshAction.setDrawable(getResources().getDrawable(R.drawable.gd_action_bar_refresh));
		refreshAction.setLoading(true);
		post=ParseObject.createWithoutData("post", ID=getIntent().getStringExtra("ID"));
		
		
		final ToolBar footer=ToolBar.inflate(this);
		footer.setMaxItemCount(4);
		footer.addItem(Type.Edit);//comment
		starAction=footer.addItem(Type.Star);
		footer.addItem(Type.Share);
		planAction=footer.addItem(Type.List);//plan
		footer.addItem(Type.Gallery);//story
		
		footer.setOnActionBarListener(new OnActionBarListener(){

			@Override
			public void onActionBarItemClicked(int position) {
				switch(position){
				case 0://comment
					Intent intent=new Intent(ShowPost.this,ShowComments.class);
					intent.putExtra("ID", ID);
					startActivity(intent);
				break;
				case 1://favorite
					favorite(new GetCallback<ParseObject>(){
						@Override
						public void done(ParseObject favorite, ParseException ex) {
							if(ex!=null){
								Toast.makeText(ShowPost.this, ex.getMessage(), Toast.LENGTH_LONG).show();
								return;
							}
							if(favorite==null){
								favorite=new ParseObject("favorite");
								favorite.put("owner", ParseUser.getCurrentUser());
								favorite.put("post", post);
								favorite.put("title", post.getString("title"));
								favorite.put("thumb", post.getParseFile("thumb"));
								favorite.saveEventually();
								starAction.getDrawable().setColorFilter(new LightingColorFilter(Color.BLACK,Color.YELLOW));
							}else{
								favorite.deleteEventually();
							}
						}
						
					});
					break;
				case 2://share to media, wb and wc
					
					break;
				case 3://plan
					getPlanWindow().showAsDropDown(footer.getItem(position).getItemView());
					plan(new GetCallback<ParseObject>(){
						@Override
						public void done(ParseObject task, ParseException ex) {
							if(ex!=null){
								Toast.makeText(ShowPost.this, ex.getMessage(), Toast.LENGTH_LONG).show();
								return;
							}
							if(task!=null)
								planTypes.check(task.getInt("type"));
						}
						
					} );
					break;
				case 4://story
					Intent intent2=new Intent(ShowPost.this,CreateStory.class);
					intent2.putExtra("ID", ID);
					intent2.putExtra("type","story");
					startActivity(intent2);
					break;
				}
				
			}
			
		});
		
		this.getActionBar().setOnActionBarListener(new OnActionBarListener(){

			@Override
			public void onActionBarItemClicked(int position) {
				switch(position){
				case OnActionBarListener.HOME_ITEM:
				default:
					onBackPressed();
				break;
				}
				
			}
			
		});
		
		refresh();	
	}
	
	public void refresh(){
		post.fetchInBackground(new GetCallback<ParseObject>(){
			@Override
			public void done(ParseObject p, ParseException ex) {
				refreshAction.setLoading(false);
				if(ex==null)
					vContent.setText(Html.fromHtml("<div align=\"center\">"+p.getString("title")+"</div>"+p.getString("content")));
				else
					vContent.setText(ex.getMessage());
				
				favorite(new GetCallback<ParseObject>(){
					@Override
					public void done(ParseObject f, ParseException ex) {
						if(ex!=null){
							Toast.makeText(ShowPost.this, ex.getMessage(), Toast.LENGTH_LONG).show();
							return;
						}
						if(f!=null)
							starAction.getDrawable().setColorFilter(new LightingColorFilter(Color.BLACK,Color.YELLOW));
					}
					
				});
				
				
				plan(new GetCallback<ParseObject>(){
					@Override
					public void done(ParseObject task, ParseException ex) {
						if(ex!=null){
							Toast.makeText(ShowPost.this, ex.getMessage(), Toast.LENGTH_LONG).show();
							return;
						}
						if(task!=null)
							planAction.getDrawable().setColorFilter(new LightingColorFilter(Color.BLACK,Color.YELLOW));
					}
				});	
			}	
		});
	}
	
	public void favorite(GetCallback<ParseObject> callback){
		ParseQuery<ParseObject> query=new ParseQuery<ParseObject>("favorite");
		query.whereEqualTo("owner", ParseUser.getCurrentUser());
		query.whereEqualTo("post", post);
		query.getFirstInBackground(callback);
	}
	
	public void plan(GetCallback<ParseObject> callback){
		ParseQuery<ParseObject> query=new ParseQuery<ParseObject>("task");
		query.whereEqualTo("owner", ParseUser.getCurrentUser());
		query.whereEqualTo("post", post);
		query.getFirstInBackground(callback);
	}
	
	private PopupWindow planWindow;
	@SuppressWarnings("static-access")
	protected PopupWindow getPlanWindow(){
		if(planWindow==null){
			LayoutInflater inflater=(LayoutInflater)this.getSystemService(Context.LAYOUT_INFLATER_SERVICE);
			View view=inflater.inflate(R.layout.plan_type, null);
			planWindow=new PopupWindow(view,view.getLayoutParams().MATCH_PARENT,view.getLayoutParams().WRAP_CONTENT);
			planTypes = (RadioGroup) view.findViewById(R.id.planType);
			planTypes.setOnCheckedChangeListener(new OnCheckedChangeListener() {
			      public void onCheckedChanged (RadioGroup group, final int checkedId) {
			    	  RadioButton type=(RadioButton)group.findViewById(checkedId);
			    	  if(type.isChecked()){
			    		  plan(new GetCallback<ParseObject>(){

							@Override
							public void done(ParseObject task,
									ParseException ex) {
								if(ex!=null){
									Toast.makeText(ShowPost.this, ex.getMessage(), Toast.LENGTH_LONG).show();
									return;
								}
								if(checkedId==0){
									if(task!=null)
										task.deleteEventually();
								}else{ 
									if(task==null){
										task=new ParseObject("task");
										task.put("owner", ParseUser.getCurrentUser());
										task.put("post", post);
										task.put("thumb", post.getParseFile("thumb"));
										task.put("title", post.getString("title"));
									}
									task.put("planAt", new Date());
									task.put("type", checkedId);
									task.saveEventually();									
								}
									
							}
			    			  
			    		  });
			    	  }
			      }
			});
		}
		planWindow.setFocusable(true);
		planWindow.setOutsideTouchable(true);
		planWindow.setBackgroundDrawable(new BitmapDrawable()); 
		return planWindow;
	}


}
