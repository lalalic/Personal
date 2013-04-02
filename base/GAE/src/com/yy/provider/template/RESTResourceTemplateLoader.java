package com.yy.provider.template;

import java.net.URI;
import java.net.URL;
import java.util.logging.Logger;

import com.sun.jersey.api.core.ResourceContext;

import freemarker.cache.ClassTemplateLoader;

public class RESTResourceTemplateLoader extends ClassTemplateLoader {
	
	private final Logger log = Logger.getLogger("TemplateLoader");
	ResourceContext context;

	public RESTResourceTemplateLoader(ResourceContext ctx,
			@SuppressWarnings("rawtypes") Class loaderClass) {
		super(loaderClass, "");
		this.context = ctx;
	}

	@Override
	protected URL getURL(String s) {
		try {
			if (!s.startsWith("/"))
				s = "/" + s;
			int fileNameIndex = s.lastIndexOf('/');
			String queryPath = s.substring(0, fileNameIndex + 1);
			String fileName = s.substring(fileNameIndex + 1);
			Object res = context.matchResource(new URI(queryPath.replace("//", "/")));
			String url;
			if (res != null) {
				String classPath = "/" + res.getClass().getPackage().getName();
				url = (canonicalizePrefix(classPath.replace('.', '/'))
						+ "/"+MultiMruCacheStorage.device.get()+"/" + fileName).replace("//", "/");
			} else
				url = s;
			return super.getURL(url);
		} catch (Exception e) {
			log.severe("can't find resource " + s);
			return null;
		}
	}

}
