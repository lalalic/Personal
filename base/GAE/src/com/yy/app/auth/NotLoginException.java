package com.yy.app.auth;

public class NotLoginException extends RuntimeException {
	private static final long serialVersionUID = -820465362180080771L;
	public String targetURL;
	public NotLoginException(String targetUrl){
		super();
		this.targetURL=targetUrl;
	}
}
