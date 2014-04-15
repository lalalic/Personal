package com.mobiengine.provider;

import java.io.IOException;

import javax.ws.rs.Consumes;
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
import com.mobiengine.service.UserService;


@Provider
@Produces(MediaType.APPLICATION_JSON)
@Consumes({MediaType.APPLICATION_JSON,MediaType.APPLICATION_OCTET_STREAM})
public class JSONObjectMapper implements ContextResolver<ObjectMapper> {
	ObjectMapper om=new ObjectMapper();
	public JSONObjectMapper(){
		SimpleModule module = new SimpleModule("appengine",Version.unknownVersion());
		module.addSerializer(Entity.class, new JSONEntity());
		module.addSerializer(EmbeddedEntity.class, new JSONEmbeddedEntity());
		om.registerModule(module);
		om.configure(SerializationConfig.Feature.WRITE_DATES_AS_TIMESTAMPS, true);
	}
	@Override
	public ObjectMapper getContext(Class<?> arg0) {
		return om;
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

}
