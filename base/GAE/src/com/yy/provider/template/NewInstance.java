package com.yy.provider.template;

import java.util.List;

import freemarker.template.TemplateMethodModelEx;
import freemarker.template.TemplateModelException;

public class NewInstance implements TemplateMethodModelEx {

	@Override
	public Object exec(@SuppressWarnings("rawtypes") List params) throws TemplateModelException {
		String className=params.get(0).toString();
		try {
			return Class.forName(className).newInstance();
		} catch (Exception e) {
			throw new RuntimeException(e.getMessage(),e);
		}
	}

}
