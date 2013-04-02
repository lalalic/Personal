package com.yy.app.test;

import java.lang.annotation.Annotation;
import java.lang.reflect.Method;
import java.net.URI;
import java.net.URISyntaxException;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

import javax.servlet.http.HttpServletRequest;
import javax.ws.rs.Consumes;
import javax.ws.rs.GET;
import javax.ws.rs.POST;
import javax.ws.rs.Path;
import javax.ws.rs.PathParam;
import javax.ws.rs.Produces;
import javax.ws.rs.core.Context;
import javax.ws.rs.core.Cookie;
import javax.ws.rs.core.MediaType;
import javax.ws.rs.core.MultivaluedMap;
import javax.ws.rs.core.Response;

import com.googlecode.objectify.Objectify;
import com.googlecode.objectify.ObjectifyService;
import com.sun.jersey.api.client.Client;
import com.sun.jersey.api.client.ClientResponse;
import com.sun.jersey.api.client.UniformInterfaceException;
import com.sun.jersey.api.client.WebResource;
import com.sun.jersey.api.model.AbstractMethod;
import com.sun.jersey.api.model.PathValue;
import com.sun.jersey.api.view.Viewable;
import com.sun.jersey.core.util.MultivaluedMapImpl;
import com.sun.jersey.spi.container.ResourceFilter;
import com.sun.jersey.spi.container.ResourceFilterFactory;
import com.yy.app.AModel;
import com.yy.app.auth.User;
import com.yy.app.cms.SlavablePost;
import com.yy.app.site.Profile;
import com.yy.rs.Caps;

@Path("test")
public class Runner extends AModel.View implements ResourceFilterFactory {
	public final static String TEST_TITLE="FOR TESTER";
	public final static String TEST_CONTENT="<b>Auto</b> <b>Test</b>,Don't care it.";
	private static List<AbstractMethod> resources = new ArrayList<AbstractMethod>();

	@Context
	public HttpServletRequest request;
	public String host;
	public String session;

	@POST
	@Path("clean")
	public Response clean() throws URISyntaxException{
		Objectify store=ObjectifyService.begin();
		@SuppressWarnings("rawtypes")
		List keys;
		for(Class<?> clazz : Profile.I.modelTypes){
			keys=store.query(clazz).filter("author", Profile.I.getTester().ID).listKeys();
			if(!keys.isEmpty())
				store.delete(keys);
		}
		return Response.seeOther(new URI("/test")).build();
	}
	
	
	@GET
	public Viewable indexUI() {
		return viewable(viewDataModel("Test All Sub-resources", "show",
				"resources", resources, "viewer", this));
	}

	@POST
	public Viewable testAll() {
		return viewable(viewDataModel("Test All Sub-resources", "show",
				"resources", resources, "test", true, "viewer", this));
	}
	
	@POST
	@Path("{IDs:\\d+(,\\d+)*}")
	public Viewable tests(@PathParam("IDs") String IDs) {
		ArrayList<AbstractMethod> list=new ArrayList<AbstractMethod>();
		for(String ID : IDs.split(","))
			list.add(resources.get(Integer.parseInt(ID)));
		
		return viewable(viewDataModel("Test Selected Sub-resources", "show",
				"resources", list, "test", true, "viewer", this));
	}

	@GET
	@Path("{index:\\d+}")
	public Viewable test1(@PathParam("index") int index) {
		WebMethod wm = getWebMethod(resources.get(index));
		return viewable(viewDataModel("Test " + wm.sub, "test1", "resource",
				wm, "results", wm.execute()));
	}

	public WebMethod getWebMethod(AbstractMethod am) {
		if (host == null) {
			host = request.getHeader("Host");
			session = request.getSession().getId();
		}
		return new WebMethod(am, host, session);
	}

	@Override
	public List<ResourceFilter> create(AbstractMethod am) {
		if (am.getMethod().isAnnotationPresent(Tests.class) ||
				am.getMethod().isAnnotationPresent(Test.class))
			resources.add(am);
		return null;
	}

	public class WebMethod {
		static final String REG_PARAM = "\\{([^\\{\\}]+)\\}";
		public AbstractMethod amethod;
		public Method m;
		public String root = "";
		public String sub = "";
		public String host;
		public String httpMethod = "GET";
		public String session;
		private Set<AModel> cycleModels;

		WebMethod(AbstractMethod am, String host, String session) {
			amethod = am;
			this.host = host;
			this.session = session;

			PathValue pathv = amethod.getResource().getPath();
			if (pathv != null)
				root = pathv.getValue();

			m = amethod.getMethod();
			Path path = m.getAnnotation(Path.class);
			if (path != null)
				sub = path.value();

			POST post = m.getAnnotation(POST.class);
			if (post != null)
				httpMethod = "POST";
		}

		public String getInputSub() {
			return sub.replaceAll(REG_PARAM,
					"{<input class=\"cond\" placeholder=\"$1\">}");
		}

		public String simpleMethod() {
			return amethod.getMethod().toString().replaceAll("(\\w+\\.)+", "")
					.replaceFirst("public", "")
					.replaceAll("(\\w+,){5}+", "$1...")
					.replaceFirst("throws.*$", "").replaceAll(" \\w+\\$", " ")
					.replaceFirst("^\\s*\\w+\\s+(\\w+\\s+)*", "");
		}

		/**
		 * Test or Tests because of TestValues order
		 * @return
		 */
		List<Test> getTestCases() {
			List<Test> tests = new ArrayList<Test>();
			Test test=m.getAnnotation(Test.class);
			if(test!=null){
				tests.add(test);
				return tests;
			}
			Tests ts=m.getAnnotation(Tests.class);
			if(ts!=null && ts.value().length>0){
				for(Test t : ts.value())
					tests.add(t);
			}
			return tests;
		}

		public List<Result> execute() {
			List<Result> results = new ArrayList<Result>();
			if (m.isAnnotationPresent(Caps.class)) {
				if (User.getCurrentUserID() == 0){
					Result result = new Result();
					result.message = "Need Signin";
					results.add(result);
					return results;
				}else {
					String[] caps = m.getAnnotation(Caps.class).value();
					if (!User.getCurrentUser().hasCapabilities(caps)){
						Result result = new Result();
						result.message = "Need caps(" + Arrays.toString(caps)
								+ ")";
						results.add(result);
						return results;
					}
				}
			}
			int index=0;
			String testPath;
			for (Test test : getTestCases()){
				if(PathIs.DEFAULT.equals(testPath=test.IF().value())
					||	root.equals(testPath))
					results.add(request(test, index));
				index++;
			}
			
			return results;
		}

		private AModel getModel(Class<?> clazz) throws InstantiationException,
				IllegalAccessException {
			AModel model = null;
			if (AModel.class.isAssignableFrom(clazz))
				model = ((AModel) clazz.newInstance());
			else if (clazz == EnclosingModel.class)
				model = (AModel) amethod.getResource().getResourceClass()
						.getEnclosingClass().newInstance();
			else if (clazz == SlaveModel.class)
				model = (AModel) ((SlavablePost) amethod.getResource()
						.getResourceClass().getEnclosingClass().newInstance())
						.getSlaveClass().newInstance();
			if(model!=null){
				if (cycleModels==null)
					cycleModels=new HashSet<AModel>();
				cycleModels.add(model);
			}
			return model;
		}

		/**
		 * 
		 * @param test
		 * @param index: the case index, which will be used for TestValue with the same index
		 * @return
		 */
		private Result request(Test test, int index) {
			String uri = "http://" + host + "/" + root;
			Result result = new Result();
			String path = "/" + sub;
			try {
				AModel model = getModel(test.model());

				if (test.removeTester())
					model.removeTester();

				// path parameters
				if (test.value().length > 0) {
					if (count(path, "{") != test.value().length) {
						result.message = "test case is right since param count doesn match.";
						return result;
					}

					for (String value : test.value()) {
						if (value.charAt(0) == '.')
							value = model.tester().fieldOf(value.substring(1))
									.toString();
						path = path.replaceFirst(REG_PARAM, value);
					}
				}
				// header,cookie params: do we use such parameters?
				// form params, only for post?
				// matrix, and query
				path += test.urlExtra();

				Client client = Client.create();
				client.setFollowRedirects(true);
				client.setConnectTimeout(1000*60*10);
				client.setReadTimeout(1000*60*10);
				WebResource wr = client.resource(uri
						+ path.replaceAll("//", "/"));
				WebResource.Builder builder = wr.getRequestBuilder();
				Consumes consumes = m.getAnnotation(Consumes.class);
				Produces produces = m.getAnnotation(Produces.class);
				String accept = produces != null ? produces.value()[0]
						: MediaType.TEXT_HTML;
				builder = wr.accept(accept);
				if (consumes != null)
					builder = wr.type(consumes.value()[0]);

				builder = wr.cookie(new Cookie("JSESSIONID", session));
				ClientResponse response;
				if ("GET".equalsIgnoreCase(httpMethod))
					response = builder.get(ClientResponse.class);
				else {
					// form params, only for post?
					List<TestValue> fields = new ArrayList<TestValue>();
					Annotation[][] fieldAns = m.getParameterAnnotations();
					if (fieldAns != null) {
						for (Annotation[] ans : fieldAns) {
							if (ans != null) {
								for (Annotation an : ans) {
									if (an instanceof TestValue)
										fields.add((TestValue) an);
									else if(an instanceof TestValues)
										fields.add(((TestValues)an).value()[index]);
								}
							}
						}
					}
					MultivaluedMap<String, String> formData = new MultivaluedMapImpl();				
					for (TestValue tv : fields) {
						if(tv.field().isEmpty())
							continue;
						if(tv.values().length==0){//single value
							String value=tv.value();
							if (value.charAt(0) == '.') {
								value = getModel(tv.model()).tester()
										.fieldOf(value.substring(1)).toString();
							}
							formData.add(tv.field(), value);
						}else{// for multi value
							for(String value : tv.values()){
								if (value.charAt(0) == '.') {
									value = getModel(tv.model()).tester()
											.fieldOf(value.substring(1)).toString();
								}
								formData.add(tv.field(), value);
							}
						}
						
					}

					response = builder.post(ClientResponse.class, formData);
				}
				try {
					result.message = response.getEntity(String.class);
					if (response.getStatus() < 300
							&& -1 == result.message
									.indexOf("Exception")) {
						String[] patterns=test.patterns();
						if(patterns.length>0){
							for (String pattern : test.patterns()) {
								if(result.message.matches(pattern)){
									result.success=true;
									break;
								}
							}
						}else
							result.success = true;
							
					}

				} catch (UniformInterfaceException e) {
					if (response.getStatus() == 204
							&& MediaType.APPLICATION_JSON
									.equalsIgnoreCase(accept))
						result.message = "No Content with 204 status";
					result.success = true;
				}

				result.url = wr.getURI().toString();
			} catch (Throwable e) {
				result.message = e.getMessage();
			}

			return result;
		}

		int count(String src, String sub) {
			int count = 0;
			int index = 0;
			while ((index = src.indexOf(sub, index + 1)) != -1)
				count++;
			return count;
		}
	}

	public class Result {
		public String url = "";
		public boolean success = false;
		public String message = "No result";
	}
}
