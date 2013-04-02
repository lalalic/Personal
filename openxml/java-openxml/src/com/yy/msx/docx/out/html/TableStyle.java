package com.yy.msx.docx.out.html;

import org.w3c.dom.Element;
import org.w3c.dom.Node;

public class TableStyle extends Style {

	public TableStyle(Node raw) {
		super(raw);
	}
	
	@Override
	protected String getSelector(){
		if(((Element)raw).hasAttribute("w:default"))
			return "table";
		else
			return super.getSelector();
	}
}
