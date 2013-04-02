package com.yy.msx.docx.out.html;

import org.w3c.dom.Node;

public class DocDefaults extends Style {

	public DocDefaults(Node raw) {
		super(raw);
	}
	
	@Override
	public void traverse(Object converted){

	}
	
	@Override
	protected String getSelector(){
		return "p";
	}
}
