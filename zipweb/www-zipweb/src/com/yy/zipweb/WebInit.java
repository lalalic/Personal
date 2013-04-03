package com.yy.zipweb;

import javax.servlet.http.HttpServletRequest;

import com.yy.web.Init;

public class WebInit extends Init {
	private static final long serialVersionUID = 1504739163232331733L;
	protected String getRequestDevice(HttpServletRequest request){
		return "mobile";
	}	
}
