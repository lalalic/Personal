package com.yy.css;

import java.util.Iterator;
import java.util.LinkedHashMap;

import org.w3c.dom.DOMException;
import org.w3c.dom.css.CSSRule;
import org.w3c.dom.css.CSSStyleDeclaration;
import org.w3c.dom.css.CSSValue;

public class StyleDeclaration implements CSSStyleDeclaration {
	private LinkedHashMap<String, CSSValue> properties = new LinkedHashMap<String, CSSValue>();

	@Override
	public String getCssText() {
		StringBuilder buffer=new StringBuilder();
		for(String key : properties.keySet())
			buffer.append(key)
				.append(":")
				.append(properties.get(key).getCssText())
				.append(";");
		return buffer.toString();
	}

	@Override
	public int getLength() {
		return properties.size();
	}

	@Override
	public CSSRule getParentRule() {
		return null;
	}

	@Override
	public CSSValue getPropertyCSSValue(String s) {
		return properties.get(s);
	}

	@Override
	public String getPropertyPriority(String s) {
		CSSValue v=getPropertyCSSValue(s);
		if(v!=null){
			String t=v.getCssText();
			int i=t.lastIndexOf('!');
			if(i!=-1)
				return t.substring(i+1);
		}
		return "";
	}

	@Override
	public String getPropertyValue(String s) {
		CSSValue v=getPropertyCSSValue(s);
		if(v!=null)
			return v.getCssText();
		return null;
	}

	@Override
	public String item(int i) {
		if(i<properties.size()){
			Iterator<CSSValue> it=properties.values().iterator();
			CSSValue v=null;
			while(i!=0){
				v=it.next();
				i--;
			}
			if(v!=null)
				return v.getCssText();
		}
		return null;
	}

	@Override
	public String removeProperty(String s) throws DOMException {
		if(properties.containsKey(s)){
			CSSValue v=getPropertyCSSValue(s);
			properties.remove(s);
			return v.getCssText();
		}
		return null;
	}

	@Override
	public void setCssText(String s) throws DOMException {
		String[] kv=null;
		for(String a : s.split(";")){
			kv=a.split(":");
			if(kv.length==2){
				this.setProperty(kv[0], kv[1], null);
			}
		}
	}

	@Override
	public void setProperty(String name, String value, String priority) throws DOMException {
		CSSValue v=new Value();
		v.setCssText(value);
		properties.put(name, v);
	}
}
