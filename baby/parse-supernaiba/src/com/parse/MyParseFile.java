package com.parse;

public class MyParseFile extends ParseFile {

	public MyParseFile(String name, String url) {
		super(name, url);
	}
	
	public MyParseFile(byte[] data) {
		super(data);
	}
	
	public MyParseFile(String name, byte[] data) {
		super(name,data);
	}
}
