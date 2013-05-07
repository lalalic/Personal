package com.yy.m.view;

import android.content.Context;
import android.webkit.WebView;

public class OfflineWebViewClient extends OnlineWebViewClient{

	public OfflineWebViewClient(Context ctx) {
		super(ctx);
	}

	@Override
	public boolean shouldOverrideUrlLoading(WebView view, String url) {
		return true;
	}

	
	
	
}