package com.yy.msx.docx.out.html.css;

import org.w3c.dom.Node;

public class RPr extends PropertyConverter {

	public RPr(Node raw) {
		super(raw);
		this.converterContext="r";
	}

}
