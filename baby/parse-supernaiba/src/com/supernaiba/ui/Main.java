package com.supernaiba.ui;

import greendroid.app.GDActivity;
import greendroid.widget.ActionBar;
import greendroid.widget.ActionBarItem.Type;
import android.os.Bundle;

import com.cyrilmottier.android.greendroid.R;
import com.parse.ParseAnalytics;

public class Main extends GDActivity {
	/** Called when the activity is first created. */
	public void onCreate(Bundle savedInstanceState) {
		super.onCreate(savedInstanceState);
		ParseAnalytics.trackAppOpened(getIntent());
		this.setActionBarContentView(R.layout.main);
		ActionBar footer=(ActionBar)this.findViewById(R.id.footer);
		footer.addItem(Type.Refresh);
		footer.addItem(Type.Share);
		footer.addItem(Type.Gallery);
		footer.addItem(Type.Edit);
	}
}
