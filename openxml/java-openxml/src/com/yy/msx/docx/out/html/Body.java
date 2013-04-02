package com.yy.msx.docx.out.html;

import org.w3c.dom.Node;

public class Body extends Converter {

	public Body(Node raw) {
		super(raw);
		this.tag="body";
	}

}
