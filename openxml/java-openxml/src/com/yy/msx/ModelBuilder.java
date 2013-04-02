package com.yy.msx;

import java.lang.reflect.Constructor;
import java.util.HashSet;
import java.util.Set;

import org.w3c.dom.Node;


public class ModelBuilder {
	protected Set<String> ignores=new HashSet<String>();
	protected String modelContainer;
	protected Document rawDocument;
	private final static ThreadLocal<ModelBuilder> builder=new ThreadLocal<ModelBuilder>(){
		@Override
		protected ModelBuilder initialValue() {
			return new ModelBuilder();
		}
	};
	
	public ModelBuilder(){
		this.modelContainer=this.getClass().getPackage().getName();
		if(isMainBuilder())
			builder.set(this);
	}
	
	public static ModelBuilder get(){
		return builder.get();
	}
	
	public Document getRawDocument(){
		return this.rawDocument;
	}
	
	public Model build(Node c){
		if(shouldIgnore(c.getNodeName()))
			return new Model.Ignorable(c);
		return new Model(c);
	}
	
	protected boolean isMainBuilder(){
		return true;
	}
	
	public boolean shouldIgnore(String nodeName){
		return ignores.contains(nodeName.toUpperCase());
	}
	
	public boolean is(String nodeName, String type){
		return nodeName.toUpperCase().endsWith(":"+type.toUpperCase());
	}
	
	protected Model instance(String type, Node c){
		try {
			Class<?> clazz = Class.forName(modelContainer+"."+type);
			Constructor<?> con=clazz.getDeclaredConstructors()[0];
			return (Model)con.newInstance(c);
		} catch (Exception e) {
			return null;
		}
	}
}
