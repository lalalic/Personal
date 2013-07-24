package com.supernaiba.parse;

import com.parse.ParseObject;
import com.parse.ParseQuery;

public class Query<T extends ParseObject> extends ParseQuery<T> {

	public Query(Class<T> subclass) {
		super(subclass);
		this.setCachePolicy(CachePolicy.CACHE_ELSE_NETWORK);
	}
	
	public Query(String subclass) {
		super(subclass);
		this.setCachePolicy(CachePolicy.CACHE_ELSE_NETWORK);
	}

}
