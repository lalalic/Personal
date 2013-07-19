package com.supernaiba.ui;

import greendroid.app.GDActivity;
import greendroid.widget.ActionBar.OnActionBarListener;
import greendroid.widget.ActionBarItem.Type;
import greendroid.widget.LoaderActionBarItem;
import greendroid.widget.ToolBar;
import android.content.Intent;
import android.os.Bundle;
import android.text.Html;
import android.widget.TextView;

import com.parse.GetCallback;
import com.parse.ParseException;
import com.parse.ParseObject;
import com.supernaiba.R;

public class ShowPost extends GDActivity {
	private String ID;
	private TextView vContent;
	private LoaderActionBarItem refreshAction;
	/** Called when the activity is first created. */
	public void onCreate(Bundle savedInstanceState) {
		super.onCreate(savedInstanceState);
		
		this.setActionBarContentView(R.layout.post1);
		vContent=(TextView)findViewById(R.id.content);
		refreshAction=(LoaderActionBarItem)addActionBarItem(getActionBar().newActionBarItem(LoaderActionBarItem.class));
		refreshAction.setDrawable(getResources().getDrawable(R.drawable.gd_action_bar_refresh));
		refreshAction.setLoading(true);
		ParseObject.createWithoutData("post", ID=getIntent().getStringExtra("ID"))
			.fetchInBackground(new GetCallback<ParseObject>(){
			@Override
			public void done(ParseObject post, ParseException ex) {
				refreshAction.setLoading(false);
				if(ex==null)
					vContent.setText(Html.fromHtml("<div align=\"center\">"+post.getString("title")+"</div>"+post.getString("content")));
				else
					vContent.setText(ex.getMessage());
			}
			
		});
		
		
		
		ToolBar footer=ToolBar.inflate(this);
		footer.setMaxItemCount(4);
		footer.addItem(Type.Edit);//comment
		footer.addItem(Type.Star);
		footer.addItem(Type.Share);
		footer.addItem(Type.List);
		
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
					
					break;
				case 2://share to media, wb and wc
					
					break;
				case 3://story
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

}
