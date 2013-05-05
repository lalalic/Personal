package com.yy.m.view;

import android.webkit.WebView;
import android.webkit.WebViewClient;

public class OnlineWebViewClient extends WebViewClient{
	@Override
	public void onPageFinished(WebView view, String url) {
		
	}
	
	public enum PAGE{
		SIGNIN,SIGNUP,POST,UNKNOWN;
		public static PAGE of(String url){
			if(url.matches("signin.html"))
				return PAGE.SIGNIN;

			return UNKNOWN;
		}
	}
}