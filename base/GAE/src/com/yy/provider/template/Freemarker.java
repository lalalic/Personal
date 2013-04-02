package com.yy.provider.template;

import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.io.OutputStreamWriter;
import java.io.PrintStream;
import java.util.HashMap;
import java.util.Map;
import java.util.logging.Logger;

import javax.servlet.ServletContext;
import javax.ws.rs.core.Context;
import javax.ws.rs.ext.ContextResolver;
import javax.ws.rs.ext.Provider;

import org.codehaus.jackson.map.ObjectMapper;

import com.sun.jersey.api.core.ResourceContext;
import com.sun.jersey.api.view.Viewable;
import com.sun.jersey.spi.template.ViewProcessor;
import com.yy.app.test.Performance;

import freemarker.cache.MultiTemplateLoader;
import freemarker.cache.TemplateLoader;
import freemarker.cache.WebappTemplateLoader;
import freemarker.template.Configuration;
import freemarker.template.DefaultObjectWrapper;
import freemarker.template.ObjectWrapper;
import freemarker.template.Template;


@Provider
public class Freemarker implements ViewProcessor<Template> {

	private final Logger log = Logger.getLogger("Template");

	protected Configuration freemarkerConfig;

	@Context
	protected ServletContext context;

	@Context
	protected ResourceContext resContext;

	@Context
	protected ContextResolver<ObjectMapper> jsonResolver;

	/**
	 * Catch any exception generated during template processing.
	 * 
	 * @param t
	 *            throwable caught
	 * @param templatePath
	 *            path of template we're executing
	 * @param templateContext
	 *            context use when evaluating this template
	 * @param out
	 *            output stream from servlet container
	 * @throws IOException
	 *             on any write errors, or if you want to rethrow
	 */
	protected void onProcessException(final Throwable t,
			final Template template, final Map<String, Object> templateContext,
			final OutputStream out) throws IOException {
		log.throwing(template.getName(), "", t);
		out.write("<pre>".getBytes());
		t.printStackTrace(new PrintStream(out));
		out.write("</pre>".getBytes());
	}

	protected Configuration getConfig() {
		if (freemarkerConfig == null) {
			// deferred initialization of the freemarker config to ensure that
			// the injected ServletContext is fully functional
			Configuration config = new Configuration();

			// allow public fields
			DefaultObjectWrapper wrapper = (DefaultObjectWrapper) ObjectWrapper.DEFAULT_WRAPPER;
			wrapper.setExposeFields(true);
			
			final InputStream fmProps = context
					.getResourceAsStream("/WEB-INF/classes/freemarker.properties");
			if (fmProps != null) {
				try {
					config.setSettings(fmProps);
					log.info("Assigned freemarker configuration from 'freemarker.properties'");
				} catch (Throwable t) {
					log.warning("Failed to load/assign freemarker.properties, will"
							+ " use default settings instead: "
							+ t.getMessage());
					log.throwing(this.getClass().getCanonicalName(),
							"getConfig", t);
				}
			}

			freemarkerConfig = config;
			
			config.setCacheStorage(new MultiMruCacheStorage(20,250,"web","mobile"));
			
			TemplateLoader[] loaders = new TemplateLoader[2];
			loaders[0] = new WebappTemplateLoader(this.context, "WEB-INF/app"){
				@Override
				public Object findTemplateSource(String name)
						throws IOException {
					return super.findTemplateSource(MultiMruCacheStorage.device.get()+"/"+name);
				}
				
			};
			loaders[1] = new RESTResourceTemplateLoader(resContext, getClass());
			MultiTemplateLoader loader = new MultiTemplateLoader(loaders);
			config.setTemplateLoader(loader);
			
			
			config.setSharedVariable("json",
					new JSONFunction(jsonResolver.getContext(Object.class)));
			config.setSharedVariable("newInstance", new NewInstance());
		}
		return freemarkerConfig;
	}

	public Template resolve(final String path){
		long start=System.currentTimeMillis();
		try {
			return getConfig().getTemplate(path);
		} catch (IOException e) {
			throw new RuntimeException(e.getMessage(),e);
		}finally{
			Performance.log("resolve "+path, 1, System.currentTimeMillis()-start);
		}

	}

	@SuppressWarnings("unchecked")
	public void writeTo(Template template, Viewable viewable, OutputStream out)
			throws IOException {
		long start=System.currentTimeMillis();
		Object model = viewable.getModel();
		
		Map<String, Object> vars =null;
		if (!(model instanceof Map<?, ?>)) {
			vars=new HashMap<String, Object>();
			vars.put("it", model);
		}else
			vars=(Map<String,Object>)model;
		
		String url = template.getName();
		vars.put("main", url);
		
		final OutputStreamWriter writer = new OutputStreamWriter(out, "utf-8");
		try {
			template.process(vars, writer);
		} catch (Throwable t) {
			onProcessException(t, template, vars, out);
		}finally{
			Performance.log("resolve viewable", 1, System.currentTimeMillis()-start);
		}

	}

}