package com.yy.msx.docx.out.html.css;

import org.w3c.dom.Node;

public class PPr extends PropertyConverter {

	public PPr(Node raw) {
		super(raw);
		this.converterContext="p";
	}
}
