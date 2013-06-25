package com.supernaiba.ui;

import android.app.Activity;
import android.os.Bundle;

import com.parse.ParseAnalytics;
import com.supernaiba.R;

public class Main extends Activity {
	/** Called when the activity is first created. */
	public void onCreate(Bundle savedInstanceState) {
		super.onCreate(savedInstanceState);
		setContentView(R.layout.main);
		ParseAnalytics.trackAppOpened(getIntent());
	}
}
