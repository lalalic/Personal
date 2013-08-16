package com.supernaiba.ui;

import greendroid.app.GDActivity;
import greendroid.widget.ActionBarItem;
import greendroid.widget.ActionBarItem.Type;
import greendroid.widget.LoaderActionBarItem;

import java.util.Date;

import android.content.Context;
import android.content.Intent;
import android.graphics.Color;
import android.graphics.LightingColorFilter;
import android.graphics.drawable.BitmapDrawable;
import android.os.Bundle;
import android.view.LayoutInflater;
import android.view.View;
import android.widget.ListView;
import android.widget.PopupWindow;
import android.widget.RadioButton;
import android.widget.RadioGroup;
import android.widget.RadioGroup.OnCheckedChangeListener;
import android.widget.Toast;

import com.parse.GetCallback;
import com.parse.Magic;
import com.parse.ParseException;
import com.parse.ParseObject;
import com.parse.ParseQuery;
import com.parse.ParseQueryAdapter.QueryFactory;
import com.parse.ParseUser;
import com.supernaiba.R;
import com.supernaiba.parse.OnGet;
import com.supernaiba.parse.Query;
import com.supernaiba.parse.QueryAdapter;
import com.supernaiba.widget.PostEditor;

public class ShowPost extends GDActivity {
	private String ID;
	private PostEditor vContent;
	private LoaderActionBarItem refreshAction;
	private ActionBarItem starAction,planAction;
	RadioGroup planTypes;
	private ParseObject post;
	/** Called when the activity is first created. */
	public void onCreate(Bundle savedInstanceState) {
		super.onCreate(savedInstanceState);
		
		this.setActionBarContentView(R.layout.post1);
		vContent=(PostEditor)findViewById(R.id.content);
		refreshAction=(LoaderActionBarItem)addActionBarItem(Type.Refresh);
		refreshAction.setLoading(true);
		post=ParseObject.createWithoutData("post", ID=getIntent().getStringExtra("ID"));
		createFooterBar(Type.Edit, Type.Share, Type.Gallery, Type.Star, Type.List);
		
		refresh();	
	}
	
	
	
	@Override
	public boolean onHandleActionBarItemClick(ActionBarItem item, int position) {
		switch(position){
		case R.drawable.gd_action_bar_refresh:
			refresh();
			break;
		default:
			onBackPressed();
			break;
		}
		return true;
	}



	@Override
	public void onHandleFooterBarItemClick(ActionBarItem item, int position) {
		if(!Magic.isLoggedIn()){
			Toast.makeText(this, "Need Login", Toast.LENGTH_SHORT).show();
			return;
		}
		switch(item.getItemId()){
		case R.drawable.gd_action_bar_edit://comment
			Intent intent=new Intent(this,ShowComments.class);
			intent.putExtra("ID", ID);
			startActivity(intent);
		break;
		case R.drawable.gd_action_bar_star://favorite
			favorite(new OnGet<ParseObject>(this){
				@Override
				public void done(ParseObject favorite, ParseException ex) {
					super.done(favorite, ex);
					if(favorite==null){
						favorite=new ParseObject("favorite");
						favorite.put("owner", ParseUser.getCurrentUser());
						favorite.put("post", post);
						favorite.put("title", post.getString("title"));
						if(favorite.containsKey("thumbnail"))
							favorite.put("thumbnail", post.getParseFile("thumbnail"));
						favorite.saveEventually();
						starAction.getDrawable().setColorFilter(new LightingColorFilter(Color.BLACK,Color.YELLOW));
					}else{
						favorite.deleteEventually();
					}
				}
				
			});
			break;
		case R.drawable.gd_action_bar_share://share to media, wb and wc
			
			break;
		case R.drawable.gd_action_bar_list://plan
			getPlanWindow().showAsDropDown(item.getItemView());
			plan(new OnGet<ParseObject>(this){
				@Override
				public void done(ParseObject task, ParseException ex) {
					super.done(task,ex);
					if(task!=null)
						planTypes.check(task.getInt("type"));
				}
				
			} );
			break;
		case R.drawable.gd_action_bar_gallery://story
			Intent intent2=new Intent(this,CreateStory.class);
			intent2.putExtra("parent", ID);
			intent2.putExtra("type","story");
			startActivity(intent2);
			break;
		}
	}



	public void refresh(){
		post.fetchInBackground(new OnGet<ParseObject>(this){
			@Override
			public void done(ParseObject p, ParseException ex) {
				super.done(p, ex);
				if(p==null)
					return;
				setTitle(p.getString("title"));
				vContent.setText("<div>"+p.getString("content")+"</div>");
				
				
				favorite(new OnGet<ParseObject>(ShowPost.this){
					@Override
					public void done(ParseObject f, ParseException ex) {
						super.done(f, ex);
						if(f!=null)
							starAction.getDrawable().setColorFilter(new LightingColorFilter(Color.BLACK,Color.YELLOW));
						refreshAction.setLoading(false);
					}
					
				});
				
				
				plan(new OnGet<ParseObject>(ShowPost.this){
					@Override
					public void done(ParseObject task, ParseException ex) {
						super.done(task, ex);
						if(task!=null)
							planAction.getDrawable().setColorFilter(new LightingColorFilter(Color.BLACK,Color.YELLOW));
						refreshAction.setLoading(false);
					}
				});	
				
				ListView vStories=(ListView)findViewById(R.id.stories);
				QueryAdapter<ParseObject> adapter=new QueryAdapter<ParseObject>(ShowPost.this, new QueryFactory<ParseObject>(){
					@Override
					public ParseQuery<ParseObject> create() {
						Query<ParseObject> query=new Query<ParseObject>("story");
						query.whereEqualTo("parent", post);
						return query;
					}
				},null);
				adapter.setTextKey("content");
				adapter.setImageKey("thumbnail");
				vStories.setAdapter(adapter);
			}	
		});
	}
	
	public void favorite(GetCallback<ParseObject> callback){
		Query<ParseObject> query=new Query<ParseObject>("favorite");
		query.whereEqualTo("owner", ParseUser.getCurrentUser());
		query.whereEqualTo("post", post);
		query.getFirstInBackground(callback);
	}
	
	public void plan(GetCallback<ParseObject> callback){
		Query<ParseObject> query=new Query<ParseObject>("task");
		query.whereEqualTo("owner", ParseUser.getCurrentUser());
		query.whereEqualTo("post", post);
		query.getFirstInBackground(callback);
	}
	
	private PopupWindow planWindow;
	protected PopupWindow getPlanWindow(){
		if(planWindow==null){
			LayoutInflater inflater=(LayoutInflater)this.getSystemService(Context.LAYOUT_INFLATER_SERVICE);
			View view=inflater.inflate(R.layout.plan_type, null);
			planWindow=new PopupWindow(view,200,600);
			planTypes = (RadioGroup) view.findViewById(R.id.planType);
			planTypes.setOnCheckedChangeListener(new OnCheckedChangeListener() {
			      public void onCheckedChanged (RadioGroup group, final int checkedId) {
			    	  RadioButton type=(RadioButton)group.findViewById(checkedId);
			    	  if(type.isChecked()){
			    		  plan(new OnGet<ParseObject>(ShowPost.this){

							@Override
							public void done(ParseObject task,
									ParseException ex) {
								super.done(task, ex);
								if(checkedId==0){
									if(task!=null)
										task.deleteEventually();
								}else{ 
									if(task==null){
										task=new ParseObject("task");
										task.put("owner", ParseUser.getCurrentUser());
										task.put("post", post);
										if(post.containsKey("thumbnail"))
											task.put("thumbnail", post.getParseFile("thumbnail"));
										task.put("title", post.getString("title"));
									}
									task.put("planAt", new Date());
									task.put("type", checkedId);
									task.saveEventually();									
								}
									
							}
			    			  
			    		  });
			    	  }
			    	  planWindow.dismiss();
			      }
			});
		}
		planWindow.setFocusable(true);
		planWindow.setOutsideTouchable(true);
		planWindow.setBackgroundDrawable(new BitmapDrawable()); 
		return planWindow;
	}
}
