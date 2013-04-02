package com.yy.provider.jaxb;

import java.util.Set;

import org.codehaus.jackson.JsonGenerator;
import org.codehaus.jackson.map.SerializerProvider;
import org.codehaus.jackson.map.ser.BeanPropertyWriter;
import org.codehaus.jackson.map.ser.impl.SimpleBeanPropertyFilter;

import com.yy.app.AModel;
import com.yy.app.auth.User;
import com.yy.rs.Caps;

public class RoleBasedFilter extends SimpleBeanPropertyFilter {

	@Override
	public void serializeAsField(Object o, JsonGenerator generator,
			SerializerProvider provider, BeanPropertyWriter writer) throws Exception {
		if(o==null){
			writer.serializeAsField(o, generator, provider);
			return;
		}
		if(o instanceof AModel){
			Long author=((AModel) o).author;
			if(author!=null){
				long currentUserID=User.getCurrentUserID();
				if(author==currentUserID){
					writer.serializeAsField(o, generator, provider);
					return;
				}
			}
		}
		Caps an=writer.getMember().getAnnotated().getAnnotation(Caps.class);
		if(an==null){
			writer.serializeAsField(o, generator, provider);
			return;
		}
		Set<String> myCaps=User.getCurrentUser().getCapabilities();
		for(String cap : an.value())
			if(!myCaps.contains(cap))
				return;
		writer.serializeAsField(o, generator, provider);
	}
}
