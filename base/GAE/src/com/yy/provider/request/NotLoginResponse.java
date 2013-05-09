package com.yy.provider.request;

import java.net.URI;
import java.net.URISyntaxException;

import javax.ws.rs.core.Response;
import javax.ws.rs.ext.ExceptionMapper;
import javax.ws.rs.ext.Provider;

import com.yy.app.auth.NotLoginException;
import com.yy.app.site.Profile;

@Provider
public class NotLoginResponse implements ExceptionMapper<NotLoginException> {
	@Override
	public Response toResponse(NotLoginException ex) {
		try {
			return Response.seeOther(new URI("/"+Profile.I.userView.path()+"/signin.html?targetURL="+ex.targetURL)).build();
		} catch (URISyntaxException e) {
			e.printStackTrace();
			return Response.ok(Profile.I.userView.signinUI(ex.targetURL,null)).build();
		}
	}

}
