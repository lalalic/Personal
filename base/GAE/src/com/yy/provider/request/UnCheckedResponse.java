package com.yy.provider.request;

import javax.ws.rs.core.Response;
import javax.ws.rs.ext.ExceptionMapper;
import javax.ws.rs.ext.Provider;

@Provider
public class UnCheckedResponse implements ExceptionMapper<RuntimeException> {
	@Override
	public Response toResponse(RuntimeException ex) {
		return Response.status(Response.Status.BAD_REQUEST)
				.entity(getStackTrace(ex)).type("text/plain").build();
	}

	public static String getStackTrace(Throwable aThrowable) {
		aThrowable.printStackTrace();
		return aThrowable.getMessage();
	}

}
