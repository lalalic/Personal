package com.yy.m.example;

import android.os.Bundle;
import android.view.View;

import com.yy.m.R;
import com.yy.m.view.BaseActivity;
import com.yy.m.view.OnPageChangeListener;
import com.yy.m.view.WebViewEx;

public class NavUI extends BaseActivity implements OnPageChangeListener{
	@Override
	protected void onCreate(Bundle saved) {
		super.onCreate(saved);
		this.setContentView(R.layout.nav);
/*
		ViewFlipper flipper = (ViewFlipper) findViewById(R.id.flipper);

		final GestureDetector detector = new GestureDetector(new GestureListener(flipper,this));
		
		OnTouchListener otl= new OnTouchListener(){
			@Override
			public boolean onTouch(View view, MotionEvent event) {
				//view.onTouchEvent(event);
				return detector.onTouchEvent(event);
			}
		};
		

		WebViewEx web=(WebViewEx)this.findViewById(R.id.plan);
		web.setOnTouchListener(otl);
		web.setHome(getString(R.string.url_home)+"/plan");
		web.loadHome();
		
		web=(WebViewEx)this.findViewById(R.id.onroad);
		web.setOnTouchListener(otl);
		web.setHome(getString(R.string.url_home)+"/onroad");
		
		web=(WebViewEx)this.findViewById(R.id.photo);
		web.setOnTouchListener(otl);
		web.setHome(getString(R.string.url_home)+"/p");
	*/	
	}

	@Override
	public void onPageChange(View current) {
		((WebViewEx)current).loadHome();
	}
}
