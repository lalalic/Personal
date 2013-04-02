package com.yy.msx.docx.out.html.css;

import org.w3c.dom.Node;
import org.w3c.dom.css.CSSStyleDeclaration;

public class Sz extends PropertyConverter {
	public Sz(Node raw) {
		super(raw);
	}
	
	@Override
	protected void convert(CSSStyleDeclaration decl){
		decl.setProperty("font-size", getInt("w:val")/2+"pt", null);
	}
	
	protected int getInt(String name){
		return Integer.parseInt(elRaw.getAttribute(name));
	}
}
