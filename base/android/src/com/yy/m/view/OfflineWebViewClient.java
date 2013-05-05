package com.yy.m.view;

import android.webkit.WebView;

public class OfflineWebViewClient extends OnlineWebViewClient{

	@Override
	public boolean shouldOverrideUrlLoading(WebView view, String url) {
		
		return super.shouldOverrideUrlLoading(view, url);
	}

	@Override
	public void onLoadResource(WebView view, String url) {

		super.onLoadResource(view, url);
	}
	
	
}