package com.supernaiba.ui;

import greendroid.app.GDActivity;
import greendroid.widget.ActionBar.OnActionBarListener;
import greendroid.widget.ActionBarItem;
import greendroid.widget.ActionBarItem.Type;
import greendroid.widget.LoaderActionBarItem;
import greendroid.widget.ToolBar;
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

import com.parse.GetCallback;
import com.parse.ParseException;
import com.parse.ParseObject;
import com.supernaiba.R;
import com.supernaiba.data.DB;

public class ShowPost extends GDActivity {
	private String ID;
	private TextView vContent;
	private LoaderActionBarItem refreshAction;
	private ActionBarItem starAction;
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
		post.fetchInBackground(new GetCallback<ParseObject>(){
			@Override
			public void done(ParseObject p, ParseException ex) {
				refreshAction.setLoading(false);
				if(ex==null)
					vContent.setText(Html.fromHtml("<div align=\"center\">"+p.getString("title")+"</div>"+p.getString("content")));
				else
					vContent.setText(ex.getMessage());
				if(isStared()){
					starAction.getDrawable().setColorFilter(new LightingColorFilter(Color.BLACK,Color.YELLOW));
				}
					
			}
			
		});
		
		
		
		ToolBar footer=ToolBar.inflate(this);
		footer.setMaxItemCount(4);
		footer.addItem(Type.Edit);//comment
		starAction=footer.addItem(Type.Star);
		footer.addItem(Type.Share);
		footer.addItem(Type.List);//plan
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
					starPost();
					break;
				case 2://share to media, wb and wc
					
					break;
				case 3://plan
					
					break;
				case 4://story
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
	}
	
	public void starPost(){
		DB db=DB.getInstance(ShowPost.this);
		if(!isStared()){
			if(db.exists("select 1 from post where objectId=?", new String[]{ID}))
				db.save("update post set favorite=? where objectId=?", new Object[][]{{1,ID}});
			else
				db.save("insert into post(objectId,favorite) values(?,?)", new Object[][]{{ID,1}});
			starAction.getDrawable().setColorFilter(new LightingColorFilter(Color.BLACK,Color.YELLOW));
		}else{
			db.save("update post set favorite=? where objectId=?", new Object[][]{{0,ID}});
		}
	}
	
	public boolean isStared(){
		return DB.getInstance(ShowPost.this).exists("select 1 from post where  objectID=? and favorite=1", new String[]{ID});
	}
	
	private PopupWindow planWindow;
	@SuppressWarnings("static-access")
	protected void getPlanWindow(){
		if(planWindow==null){
			LayoutInflater inflater=(LayoutInflater)this.getSystemService(Context.LAYOUT_INFLATER_SERVICE);
			View view=inflater.inflate(R.layout.plan_type, null);
			planWindow=new PopupWindow(view,view.getLayoutParams().MATCH_PARENT,view.getLayoutParams().WRAP_CONTENT);
			RadioGroup rb = (RadioGroup) view.findViewById(R.id.planType);
			rb.setOnCheckedChangeListener(new OnCheckedChangeListener() {
			      public void onCheckedChanged (RadioGroup group, int checkedId) {
			    	  RadioButton type=(RadioButton)group.findViewById(checkedId);
			    	  if(type.isChecked()){
			    		  int iType=(Integer)type.getTag();
			    		  if(iType==-1)
			    			  DB.getInstance(ShowPost.this).getWritableDatabase().delete("task", "where objectId=?", new String[]{ID});//remove
			    		  else if(DB.getInstance(ShowPost.this).exists("select 1 from task where objectId=?", new String[]{ID}))
			    			  DB.getInstance(ShowPost.this).save("insert into taks(objectId,)", values);
			    	  }
			      }
			});
		}
		planWindow.setFocusable(true);
		planWindow.setOutsideTouchable(true);
		planWindow.setBackgroundDrawable(new BitmapDrawable()); 
	}


}
