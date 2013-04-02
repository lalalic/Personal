package com.yy.provider.jaxb;

import org.codehaus.jackson.map.introspect.AnnotatedClass;
import org.codehaus.jackson.xc.JaxbAnnotationIntrospector;

public class JSONFilterIntrospector extends JaxbAnnotationIntrospector {

	@Override
	public Object findFilterId(AnnotatedClass ac) {
		Object id = super.findFilterId(ac);
        // but use simple class name if not
        if (id == null) {
           id = "RoleBasedFilter";
        }
        return id;

	}

}
