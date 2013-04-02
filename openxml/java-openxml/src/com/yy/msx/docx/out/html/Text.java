package com.yy.msx.docx.out.html;

import org.w3c.dom.Node;

public class Text extends Converter {

	public Text(Node raw) {
		super(raw);
	}
	
	@Override
	protected Node createNode(){
		return this.convertedDoc.createTextNode(raw.getTextContent());
	}
}
