package com.parse;

public class Magic {

	public static Object createWithUrl(String url) {
		return new ParseFile(url.substring(url.lastIndexOf('/')+1),url);
	}

}
