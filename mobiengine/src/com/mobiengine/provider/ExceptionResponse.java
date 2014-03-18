package com.mobiengine.provider;

import javax.ws.rs.core.Response;
import javax.ws.rs.ext.ExceptionMapper;
import javax.ws.rs.ext.Provider;

@Provider
public class ExceptionResponse implements ExceptionMapper<Exception> {
	@Override
	public Response toResponse(Exception ex) {
		return Response.status(Response.Status.BAD_REQUEST)
			.entity(ex.getMessage()).build();
	}
}
