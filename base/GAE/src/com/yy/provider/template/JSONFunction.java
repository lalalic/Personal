package com.yy.provider.template;

import java.util.List;

import org.codehaus.jackson.map.ObjectMapper;

import freemarker.ext.beans.BeanModel;
import freemarker.template.SimpleSequence;
import freemarker.template.TemplateMethodModelEx;
import freemarker.template.TemplateModelException;

public class JSONFunction implements TemplateMethodModelEx {
	
	ObjectMapper jsonProvider;
	
	public JSONFunction(ObjectMapper jsonProvider){
		this.jsonProvider=jsonProvider;
	}

	@SuppressWarnings("rawtypes")
	@Override
	public Object exec(List args) throws TemplateModelException {
		if(jsonProvider==null)
			throw new TemplateModelException("JSON service is not ready");
		Object bean=args.get(0);
		if(args.get(0) instanceof BeanModel)
			bean=((BeanModel)args.get(0)).getWrappedObject();
		else if(args.get(0) instanceof SimpleSequence)
			bean=((SimpleSequence)args.get(0)).toList();
		String json;
		try {
			json = jsonProvider.writeValueAsString(bean);
		} catch (Exception e) {
			throw new TemplateModelException(e);
		}
		return json;
	}
}
