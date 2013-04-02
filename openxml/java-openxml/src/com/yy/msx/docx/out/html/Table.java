package com.yy.msx.docx.out.html;

import org.w3c.dom.Node;

public class Table extends Converter {

	public Table(Node raw) {
		super(raw);
		this.tag="Table";
	}
}
