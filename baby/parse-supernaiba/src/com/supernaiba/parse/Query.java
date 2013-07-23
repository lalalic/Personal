package com.supernaiba.parse;

import com.parse.ParseObject;
import com.parse.ParseQuery;

public class Query<T extends ParseObject> extends ParseQuery<T> {

	public Query(Class<T> subclass) {
		super(subclass);
	}
	
	public Query(String subclass) {
		super(subclass);
	}

}
