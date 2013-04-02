package com.yy.css;

import org.w3c.dom.DOMException;
import org.w3c.dom.Document;
import org.w3c.dom.DocumentType;
import org.w3c.dom.css.CSSStyleRule;
import org.w3c.dom.css.CSSStyleSheet;
import org.w3c.dom.css.DOMImplementationCSS;

public class CSSImplementation implements DOMImplementationCSS {

	@Override
	public Document createDocument(String s, String s1,
			DocumentType documenttype) throws DOMException {
		return null;
	}

	@Override
	public DocumentType createDocumentType(String s, String s1, String s2)
			throws DOMException {
		return null;
	}

	@Override
	public Object getFeature(String s, String s1) {
		return null;
	}

	@Override
	public boolean hasFeature(String s, String s1) {
		return false;
	}

	@Override
	public CSSStyleSheet createCSSStyleSheet(String s, String s1)
			throws DOMException {
		return new StyleSheet();
	}

	public CSSStyleRule createCSSRule(String selector, String text){
		CSSStyleRule rule=new StyleRule();
		rule.setSelectorText(selector);
		rule.setCssText(text);
		return rule;
	}
	
	public CSSStyleRule createCSSRule(){
		return new StyleRule();
	}
}
