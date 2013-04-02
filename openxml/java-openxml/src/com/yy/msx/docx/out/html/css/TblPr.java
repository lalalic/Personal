package com.yy.msx.docx.out.html.css;

import org.w3c.dom.Node;

public class TblPr extends PropertyConverter {

	public TblPr(Node raw) {
		super(raw);
		this.converterContext="r";
	}

}
