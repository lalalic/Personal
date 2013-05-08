package com.yy.m.view;

import java.util.regex.Pattern;

import android.content.Context;
import android.util.Log;
import android.webkit.WebView;

public class OfflineWebViewClient extends OnlineWebViewClient{

	public OfflineWebViewClient(Context ctx) {
		super(ctx);
	}

	@Override
	public boolean shouldOverrideUrlLoading(WebView view, String url) {
		Pattern pattern=this.getPattern(url);
		if(pattern!=null){
			((WebViewEx)view).loadOffline(pattern.pattern());
			return true;
		}
		return false;
	}

	@Override
	public void onLoadResource(WebView view, String url) {
		Log.d("Offline", url);
	}
	
	
}