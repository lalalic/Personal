package com.yy.provider.request;

import javax.ws.rs.core.Response;
import javax.ws.rs.ext.ExceptionMapper;
import javax.ws.rs.ext.Provider;

import com.sun.jersey.api.view.Viewable;
import com.yy.app.auth.MissingCapException;

@Provider
public class MissingCapResponse implements ExceptionMapper<MissingCapException> {

	@Override
	public Response toResponse(MissingCapException ex) {
		return Response.ok(new Viewable("/error.html", ex.targetURL)).build();
	}

}
