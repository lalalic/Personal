package com.yy.jersey.filter;

import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.logging.Logger;

import com.sun.jersey.api.model.AbstractMethod;
import com.sun.jersey.api.model.AbstractSubResourceMethod;
import com.sun.jersey.api.view.Viewable;
import com.sun.jersey.spi.container.ContainerRequest;
import com.sun.jersey.spi.container.ContainerRequestFilter;
import com.sun.jersey.spi.container.ContainerResponse;
import com.sun.jersey.spi.container.ContainerResponseFilter;
import com.sun.jersey.spi.container.ResourceFilter;
import com.sun.jersey.spi.container.ResourceFilterFactory;
import com.yy.app.auth.ManagedUI;
import com.yy.app.auth.MissingCapException;
import com.yy.app.auth.NotLoginException;
import com.yy.app.auth.Role;
import com.yy.app.auth.User;
import com.yy.rs.AdminUI;
import com.yy.rs.Caps;

public class AuthFilter implements ResourceFilterFactory {
	static final Logger log = Logger.getLogger(AuthFilter.class.getName());
	private class ACLFilter implements ResourceFilter, ContainerRequestFilter,
			ContainerResponseFilter {
		private String[] needCaps;
		private boolean isAdminUI;

		ACLFilter(String[] caps, boolean isAdminUI) {
			this.needCaps = caps;
			this.isAdminUI=isAdminUI;
		}

		@Override
		public ContainerRequestFilter getRequestFilter() {
			return this;
		}

		@Override
		public ContainerResponseFilter getResponseFilter() {
			return this;
		}

		@Override
		public ContainerRequest filter(ContainerRequest request) {
			if (User.getCurrentUserID() == 0){
				request.getProperties().put("ACLError", true);
				throw new NotLoginException(request.getRequestUri().toString());
			}

			if (!User.getCurrentUser().hasCapabilities(needCaps)){
				request.getProperties().put("ACLError", true);
				throw new MissingCapException(request.getRequestUri()
						.toString());
			}

			return request;
		}

		@SuppressWarnings({ "unchecked", "rawtypes" })
		@Override
		public ContainerResponse filter(ContainerRequest req,
				ContainerResponse res) {
			
			if(req.getProperties().containsKey("ACLError"))
				return res;
			
			Object entity=res.getEntity();
			if(entity instanceof Viewable){
				Object model=((Viewable)entity).getModel();
				if(model instanceof Map)
					((Map)model).put("isManagedUI", isAdminUI);
			}
			return res;
		}

	}

	@SuppressWarnings({ "unchecked", "rawtypes" })
	@Override
	public List create(AbstractMethod am) {
		Caps caps = am.getAnnotation(Caps.class);
		AdminUI adminUI = am.getAnnotation(AdminUI.class);
		String[] needCaps = null;

		if (caps == null) {
			if (null == adminUI)
				return null;
			else
				needCaps = new String[0];
		} else {
			needCaps = caps.value();
			for (String cap : needCaps)
				Role.CAPS.add(cap);
		}

		if (null != adminUI) {
			String[] group = adminUI.value();
			String category = group[0];
			String name = group[1];

			String resPath = am.getResource().getPath().getValue();
			String subResPath = ((AbstractSubResourceMethod) am).getPath()
					.getValue();
			String path = "/" + resPath + "/" + subResPath;
			path = path.replaceAll("//", "/");

			if (AdminUI.RESOURCE_PATH.equals(category))
				category = resPath;

			if (AdminUI.RESOURCE_PATH.equals(name))
				name = resPath;

			ManagedUI.addManagedUI(category, name, path, needCaps);
		}

		return Collections.singletonList(new ACLFilter(needCaps, null != adminUI));

	}
}
