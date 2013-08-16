package com.supernaiba.ui;

import greendroid.widget.ActionBarItem;
import greendroid.widget.ActionBarItem.Type;
import greendroid.widget.ToolBar;
import android.os.Bundle;
import android.view.View;
import android.widget.EditText;

import com.parse.ParseObject;
import com.parse.ParseUser;
import com.supernaiba.R;
import com.supernaiba.parse.Query;

public class ShowComments extends BaseQueryListActivity {
	private String postID;
	private EditText vComment;
	/** Called when the activity is first created. */
	public void onCreate(Bundle savedInstanceState) {
		title=R.string.comments;
		postID=getIntent().getStringExtra("ID");
		
		super.onCreate(savedInstanceState);
	}
	
	@Override
	protected void createFooterBarItem(){
		ToolBar footer=createFooterBar();
		footer.setMaxItemCount(4);
		footer.addSizedItem(new ActionBarItem(){			
			@Override
			protected View createItemView() {
				vComment=new EditText(ShowComments.this);
				vComment.setHint(R.string.comments);
				vComment.setBackgroundResource(R.drawable.white);
				
				return vComment;
			}
			
		},3);
		footer.addItem(Type.Export);
	}

	@Override
	public void onHandleFooterBarItemClick(ActionBarItem item, int position) {
		switch(item.getItemId()){
		case R.drawable.gd_action_bar_export:
			String content=vComment.getText().toString().trim();
			if(content.length()==0)
				return;
			ParseUser user=ParseUser.getCurrentUser();
			ParseObject comment=new ParseObject("comment");
			comment.put("content", content);
			comment.put("author", user.getUsername());
			comment.put("post", postID);
			comment.saveEventually();
			refresh();
			vComment.setText("");
			break;
		}
	}
	@Override
	protected Query<ParseObject> createQuery() {
		adapter.setTextKey("content");
		
		Query<ParseObject> query=new Query<ParseObject>("comment");
		query.whereEqualTo("post", postID);
		return query;
	}
}
