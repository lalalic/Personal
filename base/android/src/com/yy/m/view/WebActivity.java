package com.yy.m.view;

import android.app.Activity;
import android.content.Intent;
import android.os.Bundle;
import android.view.Window;

import com.yy.m.R;
import com.yy.m.data.Configuration;

public class WebActivity extends BaseActivity {
	private final static String LAST_FINAL_URL="_last_url";
	public WebViewEx browser;
	protected boolean cache4Offline=true;

	
	@Override
	protected void onCreate(Bundle saved) {
		super.onCreate(saved);
		getWindow().requestFeature(Window.FEATURE_PROGRESS);
		
		setContentView(R.layout.web);
		browser = (WebViewEx) this.findViewById(R.id.browser);
		browser.setHome(this.getString(R.string.url_home));
		browser.addJavascriptInterface(this,"service");	
		onCreated(saved);
		if(saved!=null && saved.containsKey(LAST_FINAL_URL))
        	browser.loadUrl(saved.getString(LAST_FINAL_URL));
        else
        	browser.loadHome();
	}
	
	public void onCreated(Bundle saved){}

	@Override
	public void onBackPressed() {
		if (this.browser.canGoBack())
			browser.goBack();
		else
			super.onBackPressed();
	}
	
	@Override
	protected void onActivityResult(int requestCode, int resultCode, Intent data) {
		if(resultCode==Activity.RESULT_CANCELED){
			super.onActivityResult(requestCode, resultCode, data);
			return;
		}
		switch(requestCode){
		case PHOTO:
		case AUDIO:
		case FILE:
			String uri=data.getData().getPath();
			String callback=data.getStringExtra("callback");
			if(uri!=null && callback!=null && callback.length()>0)
				browser.runJS(callback+"('"+uri+"')");
			Configuration.getInstance(this).remove("callback");
			break;
		}
	}
	
	@Override
	protected void onSaveInstanceState(Bundle outState) {
		outState.putString(LAST_FINAL_URL, browser.getUrl());
		super.onSaveInstanceState(outState);
	}

	@Override
	protected void onDestroy() {
		super.onDestroy();
		if(this.cache4Offline)
			browser.saveCache();
	}
	
	public void test(){
		this.notify("test");
	}
	

}
