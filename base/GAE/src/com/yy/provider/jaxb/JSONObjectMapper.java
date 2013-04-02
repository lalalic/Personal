package com.yy.provider.jaxb;

import javax.ws.rs.ext.ContextResolver;
import javax.ws.rs.ext.Provider;

import org.codehaus.jackson.map.ObjectMapper;
import org.codehaus.jackson.map.annotate.JsonSerialize;
import org.codehaus.jackson.map.ser.FilterProvider;
import org.codehaus.jackson.map.ser.impl.SimpleFilterProvider;

@Provider
public class JSONObjectMapper implements ContextResolver<ObjectMapper> {

	ObjectMapper mapper = null;

	public JSONObjectMapper() {
		mapper = new ObjectMapper();
		mapper.getSerializationConfig().setSerializationInclusion(
				JsonSerialize.Inclusion.NON_NULL);
		FilterProvider fp = new SimpleFilterProvider().addFilter(
				"RoleBasedFilter", new RoleBasedFilter());
		mapper.setFilters(fp);
	}

	@Override
	public ObjectMapper getContext(Class<?> cls) {
		return mapper;
	}
}
