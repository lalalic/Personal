package com.yy.app.auth;

public class MissingCapException extends RuntimeException {
	private static final long serialVersionUID = -612240525669739783L;
	public String targetURL;
	public MissingCapException(String targetUrl){
		this.targetURL=targetUrl;
	}
}
