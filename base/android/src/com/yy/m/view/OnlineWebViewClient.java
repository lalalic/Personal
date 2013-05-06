package com.yy.m.view;

import android.webkit.WebView;
import android.webkit.WebViewClient;

public class OnlineWebViewClient extends WebViewClient{
	@Override
	public void onPageFinished(WebView view, String url) {
		System.out.println(url);
	}
}