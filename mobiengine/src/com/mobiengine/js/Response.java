package com.mobiengine.js;

public class Response {
	public void error(){
		error("Error from cloud code");
	}
	
	public void error(String msg){
		throw new RuntimeException(msg);
	}
	
	public void success(){
		
	}
}
