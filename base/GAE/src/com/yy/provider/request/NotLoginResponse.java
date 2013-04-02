package com.yy.provider.request;

import javax.ws.rs.core.Response;
import javax.ws.rs.ext.ExceptionMapper;
import javax.ws.rs.ext.Provider;

import com.yy.app.auth.NotLoginException;
import com.yy.app.site.Profile;

@Provider
public class NotLoginResponse implements ExceptionMapper<NotLoginException> {
	@Override
	public Response toResponse(NotLoginException ex) {
		return Response.ok(Profile.I.userView.signinUI(ex.targetURL,null)).build();
	}

}
