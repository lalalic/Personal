package com.yy.css;

import org.w3c.dom.DOMException;
import org.w3c.dom.css.CSSRule;
import org.w3c.dom.css.CSSStyleDeclaration;
import org.w3c.dom.css.CSSStyleRule;
import org.w3c.dom.css.CSSStyleSheet;

public class StyleRule implements CSSStyleRule {
	private String selectors="UNKNOWN";
	private StyleDeclaration decl=new StyleDeclaration();
	@Override
	public short getType() {
		return CSSRule.STYLE_RULE;
	}

	@Override
	public String getCssText() {
		return selectors+"{"+decl.getCssText()+"}";
	}

	@Override
	public void setCssText(String s) throws DOMException {
		int i=s.indexOf('{');
		if(i==-1)
			decl.setCssText(s);
		else{
			this.setSelectorText(s.substring(i));
			int j=s.lastIndexOf('}');
			if(j!=-1)
				decl.setCssText(s.substring(i+1,j));
			else
				decl.setCssText(s.substring(i+1));
		}
	}

	@Override
	public CSSStyleSheet getParentStyleSheet() {
		return null;
	}

	@Override
	public CSSRule getParentRule() {
		return null;
	}

	@Override
	public String getSelectorText() {
		return selectors;
	}

	@Override
	public CSSStyleDeclaration getStyle() {
		return decl;
	}

	@Override
	public void setSelectorText(String s) throws DOMException {
		selectors=s;
	}
}
