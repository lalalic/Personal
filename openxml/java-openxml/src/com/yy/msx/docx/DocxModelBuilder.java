package com.yy.msx.docx;

import org.w3c.dom.Element;
import org.w3c.dom.Node;

import com.yy.msx.Model;
import com.yy.msx.Model.Ignorable;
import com.yy.msx.ModelBuilder;
import com.yy.msx.docx.out.html.css.PropertyConverter;

public class DocxModelBuilder extends ModelBuilder {
	protected StyleBuilder styleBuilder;
	public DocxModelBuilder(){
		super();
		for(String a : 
			new String[]{"shapetype"})
			this.ignores.add(a.toUpperCase());
		styleBuilder=getStyleBuilder();
	}
	
	public  StyleBuilder getStyleBuilder() {
		if(styleBuilder==null)
			styleBuilder=new StyleBuilder();
		return styleBuilder;
	}
	@Override
	public Model build(Node c){
		String name=c.getNodeName();
		if(shouldIgnore(name))
			return new Model.Ignorable(c);
		else if(is(name,"Document"))
			return instance("Document",c);
		else if(is(name,"Styles"))
			return instance("Styles",c);
		else if(is(name,"DocDefaults"))
			return instance("DocDefaults",c);
		else if(is(name,"Style")){
			Element el=(Element)c;
			String type=el.getAttribute("w:type");
			if("paragraph".equalsIgnoreCase(type)){
				return instance("PStyle",c);
			}else if("table".equalsIgnoreCase(type)){
				return instance("TableStyle",c);
			}else if("numbering".equalsIgnoreCase(type)){
				return instance("NumberingStyle",c);
			}else if("character".equalsIgnoreCase(type)){
				return instance("CharacterStyle",c);
			}
		}else if(is(name,"Tbl"))
			return instance("Table",c);
		else if(is(name,"Tr"))
			return instance("Tr",c);
		else if(is(name,"Tc"))
			return instance("Td",c);
		else if(is(name,"P")){
			Node pr=c.getFirstChild();
			if(pr!=null && is(pr.getNodeName(),"ppr")){
				
			}
			return instance("P",c);
		}else if(is(name,"R"))
			return instance("R",c);
		else if(is(name,"T"))
			return instance("Text",c);
		return super.build(c);
	}
	
	public class StyleBuilder extends ModelBuilder{
		protected StyleBuilder(){
			super();
			for(String a : 
				new String[]{"latentStyles"})
				this.ignores.add(a.toUpperCase());
		}
		
		@Override
		protected boolean isMainBuilder(){
			return false;
		}
		
		@Override
		public Model build(Node c){
			return build(c,null);
		}
		
		public Model build(Node c, String ctx){
			String name=c.getNodeName();
			if(shouldIgnore(name))
				return new Ignorable(c);
			name=name.replaceFirst("w:", "");
			name=name.substring(0,1).toUpperCase()+name.substring(1);
			Model m=null;
			if(ctx!=null && !ctx.isEmpty())
				m=instance(ctx+"."+name,c);
			if(m==null)
				m=instance(name,c);
			if(m==null)
				m=new PropertyConverter(c);
			return m;
		}
	}
}
