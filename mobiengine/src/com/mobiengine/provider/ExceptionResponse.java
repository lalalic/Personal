package com.mobiengine.provider;

import javax.ws.rs.core.Response;
import javax.ws.rs.ext.ExceptionMapper;
import javax.ws.rs.ext.Provider;

import org.codehaus.jettison.json.JSONException;
import org.codehaus.jettison.json.JSONObject;

@Provider
public class ExceptionResponse implements ExceptionMapper<Exception> {
	@Override
	public Response toResponse(Exception ex) {
		JSONObject r=new JSONObject();
		try {
			r.put("error", ex.getMessage());
		} catch (JSONException e) {
			
		}
		return Response.status(Response.Status.BAD_REQUEST)
			.entity(r).build();
	}


}
