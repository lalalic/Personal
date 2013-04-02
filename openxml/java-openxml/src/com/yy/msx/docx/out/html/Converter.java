package com.yy.msx.docx.out.html;

import org.w3c.dom.Element;
import org.w3c.dom.Node;

import com.yy.msx.Model;
import com.yy.msx.docx.Toggleable;

public class Converter extends Model{
	protected String tag;
	protected org.w3c.dom.Document convertedDoc;
	public Converter(Node raw) {
		super(raw);
	}
	
	@Override
	public void traverse(Object parent){
		if(!(parent instanceof Node))
			return;
		Node converted=null;
		if(tag!=null)
			converted=convertedDoc.createElement(tag);
		else
			converted=createNode();
		
		Node convertedParent=(Node)parent;
		if(convertedParent!=null && converted!=null)
			convertedParent.appendChild(converted);
		
		if(converted instanceof Element){		
			try{
				convertStyle((Element)converted);
				if(this instanceof Toggleable)
					((Toggleable)this).mark();
			}catch(Exception ex){
				ex.printStackTrace();
			}
		}
		
		try{
			convertContent(converted!=null ? converted : convertedParent);
		}catch(Exception ex){
			ex.printStackTrace();
		}finally{
			if(this instanceof Toggleable)
				((Toggleable)this).toggle();
		}
	}
	
	protected void convertContent(Node converted){
		super.traverse(converted);
	}
	
	protected void convertStyle(Element converted){
		
	}
	
	protected Node createNode(){
		return null;
	}
}
