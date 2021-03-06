package com.yy.m.view;

import java.io.File;
import java.io.FileOutputStream;
import java.io.InputStream;
import java.io.OutputStream;
import java.util.HashMap;
import java.util.Map;

import org.apache.http.cookie.Cookie;

import android.annotation.SuppressLint;
import android.app.Activity;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.net.ConnectivityManager;
import android.net.NetworkInfo;
import android.net.Uri;
import android.net.wifi.WifiManager;
import android.os.Environment;
import android.util.AttributeSet;
import android.webkit.CookieManager;
import android.webkit.CookieSyncManager;
import android.webkit.URLUtil;
import android.webkit.ValueCallback;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;

import com.yy.m.R;
import com.yy.m.data.Configuration;

public class WebViewEx extends WebView{
	private static final String ASSET="file://android_asset/";
	private String home;
	private ValueCallback<Uri> uploadMsg;
	private String offlineRoot=null;
	protected boolean cache4Offline=true;
	protected boolean isOnline=false;
	protected WebViewClient offlineClient, onlineClient;

	public WebViewEx(Context context, AttributeSet attrs, int defStyle) {
		super(context, attrs, defStyle);
		init();
	}

	public WebViewEx(Context context, AttributeSet attrs) {
		this(context, attrs,0);
	}

	public WebViewEx(Context context) {
		this(context, null);
	}

	@SuppressLint("SetJavaScriptEnabled")
	private void init() {
		WebView browser = this;
		WebSettings settings = browser.getSettings();
		settings.setUserAgentString(this.getContext().getString(R.string.browserAgent)
				+this.getContext().getString(R.string.app_name));
		settings.setJavaScriptEnabled(true);
		settings.setAllowFileAccess(true);
		settings.setLoadsImagesAutomatically(true);
		settings.setDomStorageEnabled(true);
		settings.setDatabaseEnabled(true);
		String appPath=Environment.getExternalStorageDirectory().getPath()+"/Android/data/"+this.getContext().getPackageName()+"/";
		offlineRoot=appPath+"www/";
		settings.setDatabasePath(appPath+"databases/");
		browser.setWebChromeClient(new ChromeClient(this));
		
		offlineClient=new OfflineWebViewClient(this.getContext());
		onlineClient=new OnlineWebViewClient(this.getContext());
		
		ConnectivityManager cm = (ConnectivityManager) this.getContext().getSystemService(Activity.CONNECTIVITY_SERVICE);
		this.isOnline(cm!=null && cm.getActiveNetworkInfo()!=null 
				&& cm.getActiveNetworkInfo().isConnected());
	}
	
	@Override
	public void loadUrl(String url, Map<String, String> extraHeaders) {
		if(URLUtil.isHttpUrl(url) || URLUtil.isHttpsUrl(url) &&
				!(this.isOnline ? onlineClient : offlineClient).shouldOverrideUrlLoading(this, url))
			super.loadUrl(url, this.isOnline ? getHeaders(extraHeaders) : null);
	}

	@Override
	public void loadUrl(String url) {
		this.loadUrl(url, this.isOnline ? getHeaders(null) : null);
	}
	
	protected void loadOffline(String url){
		for(String path: new String[]{offlineRoot+url, ASSET+url, ASSET+"offline.html"}){
			if(new File(path).exists()){
				loadUrl(path);
				return;
			}
		}
	}
	
	protected File getOfflineFile(String url){
		File file=null;
		for(String path: new String[]{offlineRoot+url, ASSET+url, ASSET+"offline.html"}){
			if((file=new File(path)).exists())
				return file;
		}
		return file;
	}
	
	protected void cache(String path, InputStream is){
		byte[] buffer=new byte[1024];
		int len=0;
		try {
			File f=new File(offlineRoot+path);
			f.getParentFile().mkdirs();
			OutputStream os=new FileOutputStream(f);
			while((len=is.read(buffer))>0)
				os.write(buffer, 0, len);
			os.flush();
			os.close();
			is.close();
		} catch (Exception e) {
			e.printStackTrace();
		}
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
	
	protected void isOnline(boolean v){
		if(isOnline=v){
			this.setWebViewClient(onlineClient);
			this.getSettings().setCacheMode(WebSettings.LOAD_NORMAL);
		}else{
			this.setWebViewClient(offlineClient);
			this.getSettings().setCacheMode(WebSettings.LOAD_CACHE_ONLY);
		}
	}
	
	public class NetworkStateTrigger extends BroadcastReceiver{
		@Override
		public void onReceive(Context ctx, Intent intent) {
			NetworkInfo info = intent
					.getParcelableExtra(WifiManager.EXTRA_NETWORK_INFO);
			switch (info.getState()) {
			case CONNECTED:
				WebViewEx.this.isOnline(true);
				break;
			case CONNECTING:
				break;
			default:
				WebViewEx.this.isOnline(false);
			}
		}
	}
}
