package com.yy.msx;
import java.util.logging.Logger;

import org.w3c.dom.Element;
import org.w3c.dom.Node;
import org.w3c.dom.NodeList;

/**
 * Document model
 * ModelBuild should identify model according to context
 */
public class Model {
	protected static Logger logger=Logger.getAnonymousLogger();
	protected Node raw;
	
	public Model(Node raw){
		this.raw=raw;
	}
	
	public void traverse(Object o){
		iterateContent(o);
	}
	
	protected void iterateContent(Object o){
		NodeList content=getContent();
		Node child=null;
		ModelBuilder builder=getBuilder();
		for(int i=0, len=content.getLength(); i<len; i++){
			child=content.item(i);
			if(isIgnoreableChild(child))
				continue;
			initChildModel(builder.build(child))
				.traverse(o);
		}
	}
	
	protected ModelBuilder getBuilder(){
		return ModelBuilder.get();
	}
	
	protected NodeList getContent(){
		return raw.getChildNodes();
	}
	
	protected Element getElement(String name){
		NodeList nodes=((Element)raw).getElementsByTagName(name);
		if(nodes!=null && nodes.getLength()>0)
			return (Element)nodes.item(0);
		return null;
	}
	
	protected boolean isIgnoreableChild(Node child){
		return false;
	}
	
	protected Model initChildModel(Model child){
		return child;
	}
	
	public static class Ignorable extends Model{
		public Ignorable(Node raw){
			super(raw);
		}
		
		public void traverse(Object o){
			
		}
	}
}
