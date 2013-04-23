package com.yy.m.view;

import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;

public class ViewClient extends WebViewClient{
	/**
	 * 
	 */
	private final WebView webViewEx;

	/**
	 * @param webViewEx
	 */
	public ViewClient(WebView webViewEx) {
		this.webViewEx = webViewEx;
	}

	@Override
	public void onReceivedError(WebView view, int errorCode,
			String description, String failingUrl) {
		if(failingUrl.equals(this.webViewEx.getUrl()))
			view.getSettings().setCacheMode(WebSettings.LOAD_CACHE_ELSE_NETWORK);
	}

	@Override
	public void onPageFinished(WebView view, String url) {
		view.getSettings().setCacheMode(WebSettings.LOAD_DEFAULT);
	}
	
	
}