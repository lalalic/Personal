package com.yy.msx.docx.out.html;

import org.w3c.dom.Element;
import org.w3c.dom.Node;
import org.w3c.dom.css.CSSStyleRule;
import org.w3c.dom.css.CSSStyleSheet;

import com.yy.css.RuleList;
import com.yy.msx.ModelBuilder;
import com.yy.msx.docx.DocxModelBuilder;

public class Style extends Converter {
	protected CSSStyleSheet stylesheet;
	public Style(Node raw) {
		super(raw);
	}
	
	@Override
	public void traverse(Object converted){
		stylesheet=(CSSStyleSheet)converted;
		CSSStyleRule rule=createCSSRule();
		iterateContent(rule.getStyle());
	}
	
	@Override
	protected ModelBuilder getBuilder(){
		return ((DocxModelBuilder)ModelBuilder.get()).getStyleBuilder();
	}
	
	protected CSSStyleRule createCSSRule(){
		CSSStyleRule rule=((HtmlConverterBuilder)ModelBuilder.get()).cssImpl.createCSSRule();
		rule.setSelectorText(getSelector());
		((RuleList)stylesheet.getCssRules()).add(rule);
		return rule;
	}
	
	protected String getSelector(){
		return "."+((Element)raw).getAttribute("w:styleId");
	}
}
