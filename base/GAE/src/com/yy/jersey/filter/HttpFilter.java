package com.yy.jersey.filter;

import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.logging.Logger;

import javax.ws.rs.core.MediaType;
import javax.ws.rs.core.Response;

import com.sun.jersey.api.model.AbstractMethod;
import com.sun.jersey.api.model.PathValue;
import com.sun.jersey.api.view.Viewable;
import com.sun.jersey.spi.container.ContainerRequest;
import com.sun.jersey.spi.container.ContainerRequestFilter;
import com.sun.jersey.spi.container.ContainerResponse;
import com.sun.jersey.spi.container.ContainerResponseFilter;
import com.sun.jersey.spi.container.ResourceFilter;
import com.sun.jersey.spi.container.ResourceFilterFactory;
import com.yy.app.auth.User;
import com.yy.app.site.Profile;
import com.yy.app.test.Performance;

public class HttpFilter implements ResourceFilterFactory {
	static final Logger log = Logger.getLogger(AuthFilter.class.getName());
	static final Map<String,String> encoding=new HashMap<String,String>();
	static{
		encoding.put("charset", "utf-8");
	}
	static final MediaType UTF8MediaType=new MediaType("text","html",encoding);

	private class Filter implements ResourceFilter, ContainerResponseFilter {
		String path="";
		public Filter(PathValue path){
			if(path!=null)
				this.path=path.getValue();
		}
		@SuppressWarnings("unchecked")
		@Override
		public ContainerResponse filter(ContainerRequest req,
				ContainerResponse res) {
			Performance.log("resource handler", 1,Performance.UNKNOWN);
			Object entity = res.getEntity();
			if (!(entity instanceof Viewable))
				return res;

			Viewable view = (Viewable) entity;
			Map<String, Object> vars = (Map<String, Object>) view.getModel();
			if (vars == null) {
				vars = new HashMap<String, Object>();
				view = new Viewable(view.getTemplateName(), vars);
				res.setEntity(view);
			}
			
			vars.put("website", Profile.I);
			vars.put("user", User.getCurrentUser());
			vars.put("path", path);
			vars.put("request", req);
			vars.put("cookie", req.getCookieNameValueMap());
			vars.put("response", res);
			if(vars.containsKey("ETAG"))
				res.getHttpHeaders().add("ETag", vars.get("ETAG"));
			if(UTF8MediaType.isCompatible((MediaType)res.getHttpHeaders().getFirst("Content-Type")))
				res.getHttpHeaders().putSingle("Content-Type", UTF8MediaType);

			return res;
		}

		@Override
		public ContainerRequestFilter getRequestFilter() {
			return null;
		}

		@Override
		public ContainerResponseFilter getResponseFilter() {
			return this;
		}

	}

	@Override
	public List<ResourceFilter> create(AbstractMethod am) {
		Class<?> returnType = am.getMethod().getReturnType();

		if (!Viewable.class.isAssignableFrom(returnType)
				&& !Response.class.isAssignableFrom(returnType))
			return null;
		return Collections.singletonList((ResourceFilter) new Filter(am.getResource().getPath()));
	}

}
