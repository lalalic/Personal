package com.yy.msx.docx.out.html;

import org.w3c.dom.Node;

import com.yy.msx.DOCX;
import com.yy.msx.ModelBuilder;

public class Document extends Converter {

	public Document(Node raw) {
		super(raw);
		this.tag="HTML";
	}
	
	@Override
	public void traverse(Object o){
		super.traverse(convertedDoc);
	}

	@Override
	protected void convertContent(Node converted){
		Node head=this.convertedDoc.createElement("Head");
		converted.appendChild(head);
		DOCX docx=(DOCX)ModelBuilder.get().getRawDocument();
		ModelBuilder.get().build(docx.getStyles().getDocument()).traverse(head);
		super.convertContent(converted);
	}
}
