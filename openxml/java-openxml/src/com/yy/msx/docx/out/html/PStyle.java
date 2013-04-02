package com.yy.msx.docx.out.html;

import org.w3c.dom.Element;
import org.w3c.dom.Node;
import org.w3c.dom.css.CSSStyleRule;

import com.yy.msx.docx.out.html.css.RPr;

public class PStyle extends Style {

	public PStyle(Node raw) {
		super(raw);
	}
	
	@Override
	public void traverse(Object converted){
		super.traverse(converted);

		Element rPr=getElement("w:rPr");
		if(rPr==null)
			return;
		
		CSSStyleRule rRule=createCSSRule();
		rRule.setSelectorText(rRule.getSelectorText()+" span");
		new RPr(rPr).traverse(rRule.getStyle());
	}
	
	@Override
	protected boolean isIgnoreableChild(Node c){
		return c.getNodeName().equalsIgnoreCase("w:rPr");
	}
	
	@Override
	protected String getSelector(){
		if(((Element)raw).hasAttribute("w:default"))
			return "p";
		else
			return super.getSelector();
	}
}
