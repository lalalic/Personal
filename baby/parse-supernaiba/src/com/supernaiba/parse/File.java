package com.supernaiba.parse;

import com.parse.MyParseFile;

public class File extends MyParseFile {

	public File(byte[] data) {
		super(data);
	}
	
	public File(String name, byte[] data) {
		super(name,data);
	}
	
	public File(String name, String url) {
		super(name, url);
	}
	
}
