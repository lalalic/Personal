package com.yy.supernaiba;

import javax.servlet.http.HttpServletRequest;

import com.yy.web.Init;

public class Server extends Init {
	private static final long serialVersionUID = 1L;

	@Override
	protected String getRequestDevice(HttpServletRequest request) {
		return "mobile";
	}

}
