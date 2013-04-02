package com.yy.css;

import org.w3c.dom.DOMException;
import org.w3c.dom.css.CSSValue;

public class Value implements CSSValue {
	private String data;
	@Override
	public String getCssText() {
		return data;
	}

	@Override
	public short getCssValueType() {
		return 0;
	}

	@Override
	public void setCssText(String s) throws DOMException {
		data=s;
	}

}
