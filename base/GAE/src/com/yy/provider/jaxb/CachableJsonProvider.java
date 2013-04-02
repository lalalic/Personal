package com.yy.provider.jaxb;

import java.io.IOException;
import java.io.OutputStream;
import java.lang.annotation.Annotation;
import java.lang.reflect.Type;

import javax.ws.rs.core.MediaType;
import javax.ws.rs.core.MultivaluedMap;
import javax.ws.rs.ext.ContextResolver;
import javax.ws.rs.ext.MessageBodyWriter;

import org.codehaus.jackson.jaxrs.JacksonJsonProvider;

import com.yy.app.AModel;


@SuppressWarnings("rawtypes")
public class CachableJsonProvider extends JacksonJsonProvider
	implements ContextResolver<MessageBodyWriter> {

	@Override
	public MessageBodyWriter getContext(Class<?> amodel) {
		return this;
	}

	@Override
	public void writeTo(Object value, Class<?> type, Type genericType,
			Annotation[] annotations, MediaType mediaType,
			MultivaluedMap<String, Object> httpHeaders,
			OutputStream entityStream) throws IOException {
		if(value instanceof AModel){
			AModel amodel=(AModel)value;
			httpHeaders.add("Last-Modified", amodel.modified);
		}
		super.writeTo(value, type, genericType, annotations, mediaType, httpHeaders,
				entityStream);
	}
	
	

}
