package com.yy.msx.docx.out.html.css;

import org.w3c.dom.Element;
import org.w3c.dom.Node;
import org.w3c.dom.NodeList;
import org.w3c.dom.css.CSSStyleDeclaration;

import com.yy.msx.ModelBuilder;
import com.yy.msx.docx.DocxModelBuilder;
import com.yy.msx.docx.out.html.Converter;

public class PropertyConverter extends Converter {
	protected String converterContext=null;
	protected Element elRaw;
	public PropertyConverter(Node raw) {
		super(raw);
		elRaw=(Element)raw;
	}
	
	@Override
	public void traverse(Object o){
		if(!(o instanceof CSSStyleDeclaration))
			return;
		convert((CSSStyleDeclaration)o);
	}
	
	protected void convert(CSSStyleDeclaration o){
		NodeList content=getContent();
		Node child=null;
		DocxModelBuilder.StyleBuilder builder=(DocxModelBuilder.StyleBuilder)getBuilder();
		for(int i=0, len=content.getLength(); i<len; i++){
			child=content.item(i);
			if(isIgnoreableChild(child))
				continue;
			initChildModel(builder.build(child,converterContext))
				.traverse(o);
		}
	}
	
	@Override
	protected ModelBuilder getBuilder(){
		return ((DocxModelBuilder)ModelBuilder.get()).getStyleBuilder();
	}
}
