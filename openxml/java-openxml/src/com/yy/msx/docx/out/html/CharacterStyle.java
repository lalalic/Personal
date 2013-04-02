package com.yy.msx.docx.out.html;

import org.w3c.dom.Element;
import org.w3c.dom.Node;

public class CharacterStyle extends Style {

	public CharacterStyle(Node raw) {
		super(raw);
	}
	
	@Override
	protected String getSelector(){
		if(((Element)raw).hasAttribute("w:default"))
			return "span";
		else
			return super.getSelector();
	}
}
