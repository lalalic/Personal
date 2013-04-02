package com.yy.provider.request;

import javax.ws.rs.core.Response;
import javax.ws.rs.ext.ExceptionMapper;
import javax.ws.rs.ext.Provider;

import com.sun.jersey.api.NotFoundException;

@Provider
public class NotFoundResponse implements ExceptionMapper<NotFoundException> {

	@Override
	public Response toResponse(NotFoundException ex) {
		return Response.status(Response.Status.BAD_REQUEST)
				.entity("Not Found:" + ex.getNotFoundUri()).type("text/plain")
				.build();
	}

}
