package com.mobiengine.filter;

import java.util.Collections;
import java.util.HashMap;
import java.util.List;

import javax.script.ScriptEngine;
import javax.script.ScriptEngineManager;
import javax.script.ScriptException;

import com.google.appengine.api.datastore.Entity;
import com.mobiengine.service.Service;
import com.sun.jersey.api.model.AbstractMethod;
import com.sun.jersey.spi.container.ContainerRequest;
import com.sun.jersey.spi.container.ContainerRequestFilter;
import com.sun.jersey.spi.container.ContainerResponse;
import com.sun.jersey.spi.container.ContainerResponseFilter;
import com.sun.jersey.spi.container.ResourceFilter;
import com.sun.jersey.spi.container.ResourceFilterFactory;

public class CloudCode implements ResourceFilterFactory{

	@SuppressWarnings({ "unchecked", "rawtypes" })
	@Override
	public List create(AbstractMethod method) {
		return Collections.singletonList(new Filter());
	}

	private class Filter implements ResourceFilter, ContainerResponseFilter, ContainerRequestFilter{
		ScriptEngineManager engineFactory = new ScriptEngineManager();
		@Override
		public ContainerRequest filter(ContainerRequest request) {
			Service service=getService(request);
			Entity app=service.getApp();
			if(app.hasProperty("cloudCode"))
			{
				ScriptEngine engine=getEngine(service);
				try {
					String code="Cloud.beforeSave('_user',function(){})";
					engine.eval(code);
				} catch (ScriptException e) {
					
				}
			}
			return request;
		}

		@Override
		public ContainerResponse filter(ContainerRequest request,
				ContainerResponse response) {
			
			return response;
		}

		@Override
		public ContainerRequestFilter getRequestFilter() {
			return this;
		}

		@Override
		public ContainerResponseFilter getResponseFilter() {
			return this;
		}
		
		@SuppressWarnings({ "rawtypes" })
		private Service getService(ContainerRequest request){
			return (Service)((HashMap)request.getProperties().get("com.sun.jersey.scope.PerRequest")).values().iterator().next();
		}
		
		private ScriptEngine getEngine(Service service){
			ScriptEngine engine=engineFactory.getEngineByName("JavaScript");
			engine.put("Cloud", service);
			return engine;
		}
	}
}
