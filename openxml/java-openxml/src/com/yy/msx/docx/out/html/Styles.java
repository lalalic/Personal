package com.yy.msx.docx.out.html;

import org.w3c.dom.Node;

import com.yy.msx.ModelBuilder;


public class Styles extends Converter {

	public Styles(Node raw) {
		super(raw);
		this.tag="Style";
	}
	
	@Override
	protected void convertContent(Node converted){
		Node stylesheet=(Node)((HtmlConverterBuilder)ModelBuilder.get()).stylesheet;
		super.convertContent(stylesheet);
		converted.appendChild(convertedDoc.createComment("\r\n"+stylesheet.toString()));
	}
}
