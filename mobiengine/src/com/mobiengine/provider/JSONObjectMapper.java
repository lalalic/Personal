package com.mobiengine.provider;

import java.io.IOException;
import java.util.Date;

import javax.ws.rs.Produces;
import javax.ws.rs.core.MediaType;
import javax.ws.rs.ext.ContextResolver;
import javax.ws.rs.ext.Provider;

import org.codehaus.jackson.JsonGenerator;
import org.codehaus.jackson.JsonProcessingException;
import org.codehaus.jackson.Version;
import org.codehaus.jackson.map.JsonSerializer;
import org.codehaus.jackson.map.ObjectMapper;
import org.codehaus.jackson.map.SerializationConfig;
import org.codehaus.jackson.map.SerializerProvider;
import org.codehaus.jackson.map.module.SimpleModule;

import com.google.appengine.api.datastore.EmbeddedEntity;
import com.google.appengine.api.datastore.Entity;
import com.google.appengine.api.datastore.Text;
import com.mobiengine.service.UserService;


@Provider
@Produces(MediaType.APPLICATION_JSON)
public class JSONObjectMapper implements ContextResolver<ObjectMapper> {
	ObjectMapper om=new ObjectMapper();
	public JSONObjectMapper(){
		SimpleModule module = new SimpleModule("appengine",Version.unknownVersion());
		module.addSerializer(Entity.class, new JSONEntity());
		module.addSerializer(EmbeddedEntity.class, new JSONEmbeddedEntity());
		module.addSerializer(Text.class, new JSONText());
		/**
		 * since JSONObject use Date.toString() to convert, so make it compatible
		 */
		module.addSerializer(java.util.Date.class, new JSONObjectDate());
		om.registerModule(module);
		om.configure(SerializationConfig.Feature.WRITE_DATES_AS_TIMESTAMPS, false);
		om.configure(SerializationConfig.Feature.FAIL_ON_EMPTY_BEANS, false);
	}
	@Override
	public ObjectMapper getContext(Class<?> arg0) {
		return om;
	}
	
	private static class JSONObjectDate extends JsonSerializer<java.util.Date>{

		@Override
		public void serialize(Date d, JsonGenerator jg,
				SerializerProvider provider) throws IOException,
				JsonProcessingException {
			jg.writeString(d.toString());
		}
		
	}

	private static class JSONEntity extends JsonSerializer<Entity>{

		@Override
		public void serialize(Entity entity, JsonGenerator jg,
				SerializerProvider provider) throws IOException,
				JsonProcessingException {
			try {
				if(entity.getKey().getId()!=0)
					entity.setProperty("id", entity.getKey().getId());
				if(UserService.KIND.equals(entity.getKind()))
					entity.removeProperty("password");
				jg.writeObject(entity.getProperties());
			} finally  {
				entity.removeProperty("id");
			}
		}
	}
	
	private static class JSONEmbeddedEntity extends JsonSerializer<EmbeddedEntity>{
		@Override
		public void serialize(EmbeddedEntity entity, JsonGenerator jg,
				SerializerProvider provider) throws IOException,
				JsonProcessingException {
			jg.writeObject(entity.getProperties());
		}
	}
	
	private static class JSONText extends JsonSerializer<Text>{
		@Override
		public void serialize(Text entity, JsonGenerator jg,
				SerializerProvider provider) throws IOException,
				JsonProcessingException {
			jg.writeString(entity.getValue());
		}
	}

}
