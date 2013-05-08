package com.yy.m.view;

import java.net.MalformedURLException;
import java.net.URL;
import java.util.ArrayList;
import java.util.List;
import java.util.regex.Pattern;

import android.content.Context;
import android.util.Log;
import android.webkit.CacheManager;
import android.webkit.CacheManager.CacheResult;
import android.webkit.URLUtil;
import android.webkit.WebView;
import android.webkit.WebViewClient;

import com.yy.m.R;

public class OnlineWebViewClient extends WebViewClient{
	protected static List<Pattern> PATHS=null;
	Context ctx;
	public OnlineWebViewClient(Context ctx){
		if(PATHS!=null)
			return;
		PATHS=new ArrayList<Pattern>();
		for(String path: ctx.getResources().getStringArray(R.array.caches))
			PATHS.add(Pattern.compile(path));
	}
	
	@Override
	public void onPageFinished(WebView view, String url){
		Log.d("web loaded",url);
		if(!(URLUtil.isHttpUrl(url) || URLUtil.isHttpsUrl(url)))
			return;
		Pattern pattern=getPattern(url);
		if(pattern==null)
			return;
		CacheResult cache=CacheManager.getCacheFile(url, null);
		if(cache==null)
			return;
		((WebViewEx)view).cache(pattern.pattern(), cache.getInputStream());
		PATHS.remove(pattern);	
	}
	
	

	@Override
	public boolean shouldOverrideUrlLoading(WebView view, String url) {
		if(url.indexOf('#')!=-1)
			return true;
		return false;
	}

	@Override
	public void onLoadResource(WebView view, String url) {
		Log.d("Online", url);
	}

	protected String getPath(String url){
		try {
			String path=new URL(url).getPath();
			if(path.endsWith("/"))
				path+="index.html";
			if(path.startsWith("/"))
				path=path.substring(1);
			return path;
		} catch (MalformedURLException e) {
			e.printStackTrace();
		}
		return url;
	}
	
	protected Pattern getPattern(String url){
		String path=getPath(url);
		for(Pattern pattern : PATHS){
			if(pattern.matcher(path).matches())
				return pattern;
		}
		return null;
	}
}