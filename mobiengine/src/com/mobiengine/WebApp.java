package com.mobiengine;

import java.io.IOException;

import javax.servlet.ServletException;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import com.sun.jersey.spi.container.servlet.ServletContainer;

public class WebApp extends ServletContainer {
	private static final long serialVersionUID = -6901099181473902636L;

	@Override
	public void service(HttpServletRequest request, HttpServletResponse response)
			throws ServletException, IOException {
		response.addHeader("Access-Control-Allow-Headers","X-Application-Id,Request,X-Requested-With");
		response.addHeader("Access-Control-Allow-Origin", "*");
		response.addHeader("Access-Control-Allow-Method", "*");
		if(request.getMethod().toUpperCase()=="OPTIONS")
			return;
		long start=System.currentTimeMillis();
		super.service(request, response);
		response.addIntHeader("X-Runtime", (int)(System.currentTimeMillis()-start));
	}

}
