package com.supernaiba.ui;

import greendroid.app.GDListActivity;
import greendroid.widget.ActionBarItem.Type;
import greendroid.widget.ToolBar;
import android.os.Bundle;
import android.widget.ArrayAdapter;

import com.parse.ParseAnalytics;

public class Main extends GDListActivity {
	/** Called when the activity is first created. */
	public void onCreate(Bundle savedInstanceState) {
		super.onCreate(savedInstanceState);
		ParseAnalytics.trackAppOpened(getIntent());
		
		ToolBar footer=ToolBar.inflate(this);
		footer.setMaxItemCount(4);
		footer.addItem(Type.Share);
		footer.addItem(Type.Share);
		footer.addItem(Type.Gallery);
		footer.addItem(Type.Edit);
		
		this.getListView().setAdapter(new ArrayAdapter<String>(this,android.R.layout.simple_list_item_1,new String[]{"Game","Reading"}));
		
	}
}
