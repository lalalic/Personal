package com.yy.web;

import java.io.IOException;
import java.util.logging.Logger;

import javax.servlet.ServletException;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import com.yy.app.auth.User;
import com.yy.app.site.Profile;
import com.yy.app.test.Performance;
import com.yy.provider.template.MultiMruCacheStorage;

public class Init extends com.sun.jersey.spi.container.servlet.ServletContainer {
	private static final long serialVersionUID = 1932499486102196393L;
	protected static final Logger log = Logger.getLogger(Init.class.getName());

	@Override
	public void init() throws ServletException {
		super.init();

		try {
			getProfiler().load(this.getServletContext().getResourceAsStream(
					"/WEB-INF/conf.yml"));
		} catch (Exception e) {
			throw new ServletException(e);
		}
	}

	@Override
	public void service(HttpServletRequest request, HttpServletResponse response)
			throws ServletException, IOException {		
		try {
			Performance.setRequest(request.getRequestURL().toString());
			MultiMruCacheStorage.device.set(getRequestDevice(request));
			User.currentUserID.set(0L);
			Object currentUserID = request.getSession().getAttribute(
					User.SESSION_CURRENT_USERID);
			if (currentUserID != null)
				User.currentUserID.set((Long) currentUserID);
			else if (request.getHeader("user") != null)
				Profile.I.userView.signinFromHttpHeader(request);
			super.service(request, response);
		}finally{
			Performance.save();
		}
	}
	
	protected String getRequestDevice(HttpServletRequest request){
		String agent=request.getHeader("User-Agent");
		if(agent==null || agent.matches(".*(m|M)obile.*"))
			return "mobile";
		return "web";
	}
	
	protected Profile getProfiler(){
		return new Profile();
	}
}
