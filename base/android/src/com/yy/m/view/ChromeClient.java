package com.yy.m.view;

import android.app.AlertDialog;
import android.util.Log;
import android.webkit.ConsoleMessage;
import android.webkit.JsResult;
import android.webkit.WebChromeClient;
import android.webkit.WebStorage.QuotaUpdater;
import android.webkit.WebView;

public class ChromeClient extends WebChromeClient{
	private WebView webViewEx;
	public ChromeClient(WebView webViewEx) {
		this.webViewEx = webViewEx;
	}

	@Override
	public boolean onConsoleMessage(ConsoleMessage cm) {
		Log.d(this.webViewEx.getContext().getPackageName(), cm.message() + " -- From line " + cm.lineNumber()
				+ " of " + cm.sourceId());
		return true;
	}
	
	@Override
	public void onExceededDatabaseQuota(String url, String databaseIdentifier,
			long currentQuota, long estimatedSize, long totalUsedQuota,
			QuotaUpdater quotaUpdater) {
		quotaUpdater.updateQuota(totalUsedQuota+currentQuota);
	}

	@Override
	public void onReachedMaxAppCacheSize(long spaceNeeded, long totalUsedQuota,
			QuotaUpdater quotaUpdater) {
		quotaUpdater.updateQuota(totalUsedQuota+5*1024*1024);
	}

	@Override
	public boolean onJsAlert(WebView view, String url, String message,
			JsResult result) {
		final AlertDialog.Builder builder = new AlertDialog.Builder(view
				.getContext());
		builder.setTitle(view.getTitle())
			.setMessage(message)
			.setCancelable(false)
			.setPositiveButton("OK", null);
		AlertDialog alert=builder.create();
		alert.show();
		result.confirm();				
		return true;
	}
	
}