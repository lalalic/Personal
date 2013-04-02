package com.yy.m.view;

import java.io.File;
import java.io.FileFilter;
import java.io.FileInputStream;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.util.HashMap;
import java.util.Map;

import org.apache.http.cookie.Cookie;

import android.annotation.SuppressLint;
import android.app.Activity;
import android.content.Context;
import android.net.ConnectivityManager;
import android.net.Uri;
import android.os.Environment;
import android.util.AttributeSet;
import android.util.Log;
import android.webkit.CookieManager;
import android.webkit.CookieSyncManager;
import android.webkit.ValueCallback;
import android.webkit.WebSettings;
import android.webkit.WebView;

import com.yy.m.data.Configuration;

public class WebViewEx extends WebView{
	private String home;
	private ValueCallback<Uri> uploadMsg;
	private String offlineRoot=null;

	public WebViewEx(Context context, AttributeSet attrs, int defStyle) {
		super(context, attrs, defStyle);
		init();
	}

	public WebViewEx(Context context, AttributeSet attrs) {
		super(context, attrs);
		init();
	}

	public WebViewEx(Context context) {
		super(context);
		init();
	}

	@SuppressLint("SetJavaScriptEnabled")
	private void init() {
		WebView browser = this;
		WebSettings settings = browser.getSettings();
		settings.setJavaScriptEnabled(true);
		settings.setAllowFileAccess(true);
		settings.setLoadsImagesAutomatically(true);
		settings.setDomStorageEnabled(true);
		settings.setCacheMode(WebSettings.LOAD_CACHE_ELSE_NETWORK);
		settings.setDatabaseEnabled(true);
		String appPath=Environment.getExternalStorageDirectory().getPath()+"/Android/data/"+this.getContext().getPackageName()+"/";
		offlineRoot=appPath+"www/";
		settings.setDatabasePath(appPath+"databases/");
		browser.setWebChromeClient(new ChromeClient(this));
		browser.setWebViewClient(new ViewClient(this));
	}
	
	@Override
	public void loadUrl(String url, Map<String, String> extraHeaders) {
		super.loadUrl(url, getHeaders(extraHeaders));
	}

	@Override
	public void loadUrl(String url) {
		getSettings().setCacheMode(isOnline()?WebSettings.LOAD_DEFAULT:WebSettings.LOAD_CACHE_ELSE_NETWORK);
		this.loadUrl(url, getHeaders(null));
	}
	
	protected void loadOffline(String url){
		if(new File(offlineRoot+url).exists()){
			loadUrl(offlineRoot+url);
		}else if(new File("file://android_asset/"+url).exists()){
			loadUrl("file://android_asset/"+url);
		}else
			this.loadUrl("file://android_asset/offline.html");
	}
	
	protected void cache(String url, byte[] data){
		Log.d("Cache", "cache "+url);
	}

	private Map<String, String> getHeaders(Map<String, String> headers) {
		if (!syncSession()) {
			Configuration conf = Configuration.getInstance(this.getContext());
			String user = conf.get("user");
			String password = conf.get("password");
			if (user.length() > 0 && password.length() > 0) {
				if (headers == null)
					headers = new HashMap<String, String>();
				headers.put("user", user);
				headers.put("password", password);
			}
		}
		return headers;
	}

	protected boolean syncSession() {
		Cookie sessionCookie = Configuration.sessionCookie;
		if (sessionCookie != null) {
			CookieSyncManager.createInstance(this.getContext());
			CookieManager cookieManager = CookieManager.getInstance();
			cookieManager.removeSessionCookie();
			String cookieString = sessionCookie.getName() + "="
					+ sessionCookie.getValue() + "; domain="
					+ sessionCookie.getDomain();
			cookieManager.setCookie(sessionCookie.getDomain(), cookieString);
			CookieSyncManager.getInstance().sync();
			return true;
		}
		return false;
	}

	public void loadHome() {
		if (home != null)
			loadUrl(this.home);
	}

	public void setHome(String home) {
		this.home = home;
	}

	public String getHome() {
		return home;
	}
	
	public String getOfflineRoot(){
		if(offlineRoot==null){
			offlineRoot=this.getContext().getCacheDir().getAbsolutePath();
			offlineRoot=offlineRoot.substring(0, offlineRoot.lastIndexOf('/'))+"/www/";
		}
		return this.offlineRoot;
	}
	
	public void runJS(String js) {
		this.loadUrl("javascript:" + js.replace('`', '"'));
	}

	public ValueCallback<Uri> getUploadMsg() {
		return uploadMsg;
	}
	
	public void clearUploadMsg(){
		this.uploadMsg=null;
	}
	
	protected boolean isOnline(){
		ConnectivityManager cm = (ConnectivityManager) this.getContext().getSystemService(Activity.CONNECTIVITY_SERVICE);
		return cm!=null 
				&& cm.getActiveNetworkInfo()!=null 
				&& cm.getActiveNetworkInfo().isConnected();
	}
	


	public void saveCache() {
		File cacheDir=this.getContext().getCacheDir();
		final String cacheDirPath=cacheDir.getPath()+"/";
		final byte[] data=new byte[1024*10];
		cacheDir.listFiles(new FileFilter(){
			@Override
			public boolean accept(File file) {
				if(file.isFile()){
					File offline=new File(file.getAbsolutePath().replaceFirst(cacheDirPath, WebViewEx.this.offlineRoot));
					InputStream is=null;
					OutputStream os=null;
					try {
						is=new FileInputStream(file);
						os=new FileOutputStream(offline);
						int len=0;
						while((len=is.read(data))>0)
							os.write(data, 0, len);
					} catch (Exception e) {
						e.printStackTrace();
					}finally{
						try {
							if(is!=null)
								is.close();
						} catch (IOException e) {
							e.printStackTrace();
						}
						try {
							if(os!=null)
								os.close();
						} catch (IOException e) {
							e.printStackTrace();
						}
					}
				}else{ 
					String dir=file.getAbsolutePath().replace(cacheDirPath, WebViewEx.this.offlineRoot);
					new File(dir).mkdirs();
					file.listFiles(this);
				}
				return false;
			}
			
		});
	}

}
