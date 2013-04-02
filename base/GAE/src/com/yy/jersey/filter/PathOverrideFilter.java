package com.yy.jersey.filter;

import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.logging.Logger;

import com.sun.jersey.api.model.AbstractMethod;
import com.sun.jersey.api.model.AbstractResource;
import com.sun.jersey.api.model.AbstractSubResourceMethod;
import com.sun.jersey.spi.container.ResourceFilter;
import com.sun.jersey.spi.container.ResourceFilterFactory;

/**
 * It filters the subresources in parent class that have same path with those in sub classes.
 * 
 * It make jersey supports Path is able to be overrode by a method in sub classes
 * 
 * It uses the following logic to hacks jersey:
 * ResourceUriRules(){
 * 		...
 *  	processSubResourceLocators(resource, rulesMap);// so the Resource class must have Sub Resource Locator. AModel.View already includes one.
        processSubResourceMethods(resource, implictProduces, rulesMap);
        processMethods(resource, implictProduces, rulesMap);
        rulesMap.processConflicts(...)
        ...
 * } 
 * 
 * But, it only check Path and HttpMethod, not including consumes and produces
 * @author lir6
 *
 */
public class PathOverrideFilter implements ResourceFilterFactory {
	static final Logger log = Logger.getLogger(PathOverrideFilter.class.getName());
	private Set<AbstractResource> resolvedResources=new HashSet<AbstractResource> ();
	private Set<AbstractResource> noLocatorResources=new HashSet<AbstractResource> ();

	@Override
	public List<ResourceFilter> create(AbstractMethod am) {
		AbstractResource ar=am.getResource();
		if(!(resolvedResources.contains(ar) || noLocatorResources.contains(ar))){
			
			if(0==ar.getSubResourceLocators().size()){
				noLocatorResources.add(ar);
				return null;
			}
			
			resolvedResources.add(ar);

			Map<String, AbstractSubResourceMethod> mm=new HashMap<String, AbstractSubResourceMethod>();
			List<AbstractSubResourceMethod> subResources=ar.getSubResourceMethods();
			String key;
			for(AbstractSubResourceMethod m : subResources){
				key=m.getPath().getValue()+"|"+m.getHttpMethod();
				if(!mm.containsKey(key)){
					mm.put(key, m);
					continue;
				}
				Class<?> classOutOfMap=m.getMethod().getDeclaringClass();
				Class<?> classInMap=mm.get(key) .getMethod().getDeclaringClass();
				//keep sub class's method
				if(classInMap.isAssignableFrom(classOutOfMap)){//classInMap is super class
					mm.put(key, m);
				}
			}
			subResources.clear();
			subResources.addAll(mm.values());
			mm.clear();
			mm=null;
		}
		return null;
	}

}
