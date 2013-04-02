package com.equ.service;

import org.apache.http.HttpEntity;
import org.apache.http.HttpResponse;
import org.apache.http.HttpVersion;
import org.apache.http.client.HttpClient;
import org.apache.http.client.methods.HttpPost;
import org.apache.http.cookie.Cookie;
import org.apache.http.entity.mime.MultipartEntity;
import org.apache.http.impl.client.DefaultHttpClient;
import org.apache.http.params.BasicHttpParams;
import org.apache.http.params.CoreProtocolPNames;
import org.apache.http.params.HttpConnectionParams;
import org.apache.http.params.HttpParams;

import com.yy.m.data.Configuration;
import com.yy.m.service.AService;

public abstract class Updater {
	protected boolean isUpdatable = false;
	private boolean uploading = false;
	protected AService service;

	public Updater(AService service) {
		this.service = service;
	}

	public void updatable(boolean value) {
		this.isUpdatable = value;
	}

	public void upload() {
		if (uploading)
			return;

		uploading = true;
		new Thread() {
			@Override
			public void run() {
				try {
					doUpload();
				} finally {
					uploading = false;
				}
			}
		}.start();
	}

	protected abstract boolean doUpload();

	public abstract void add(Object item);

	public abstract void release();

	protected HttpEntity post(String url, MultipartEntity data) {
		final HttpParams httpParams = new BasicHttpParams();
		HttpConnectionParams.setConnectionTimeout(httpParams, 10 * 60 * 1000);
		HttpConnectionParams.setSoTimeout(httpParams, 10 * 60 * 1000);
		HttpClient httpclient = new DefaultHttpClient(httpParams);
		httpclient.getParams().setParameter(
				CoreProtocolPNames.PROTOCOL_VERSION, HttpVersion.HTTP_1_1);
		try {
			HttpPost httppost = new HttpPost(url);
			httppost.setEntity(data);
			Configuration conf = Configuration.getInstance(service);
			if(Configuration.sessionCookie!=null){
				Cookie c=Configuration.sessionCookie;
				String cookie= c.getName()+"="+c.getValue()+";domain="+c.getDomain();
				httpclient.getParams().setParameter("Cookie", cookie);
			}
			httppost.addHeader("user", conf.get("user"));
			httppost.addHeader("password", conf.get("password"));

			HttpResponse response = httpclient.execute(httppost);
			return response.getEntity();
		} catch (Exception e) {
			return null;
		} finally {
			httpclient.getConnectionManager().shutdown();
		}
	}
}