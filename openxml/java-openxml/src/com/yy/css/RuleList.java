package com.yy.css;

import java.util.ArrayList;

import org.w3c.dom.css.CSSRule;
import org.w3c.dom.css.CSSRuleList;

public class RuleList extends ArrayList<CSSRule> implements CSSRuleList {
	private static final long serialVersionUID = 2523132729440033709L;

	@Override
	public int getLength() {
		return this.size();
	}

	@Override
	public CSSRule item(int i) {
		return this.get(i);
	}

}
