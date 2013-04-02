package com.yy.msx;

import java.io.InputStream;

import com.yy.msx.docx.out.html.HtmlConverterBuilder;

public class DOCX extends Document{
	private Part styles;
	public DOCX(InputStream in) {
		super(in);
	}
	
	@Override
	protected void parseDocument(){
		super.parseDocument();
		main=new Part("word/document.xml");
	}
	
	public Part getStyles(){
		if(styles==null)
			styles=new Part("word/styles.xml");
		return styles;
	}
	
	public static void main(String[] args){
		try {
			String root="C:\\Users\\lir6\\workspace\\openxml\\test\\";
			HtmlConverterBuilder builder=new HtmlConverterBuilder();
			new DOCX(new java.io.FileInputStream(root+"test.docx"))
				.traverseWith(builder);
			builder.output(new java.io.FileOutputStream(root+"test.docx.html"));
		} catch (Exception e) {
			e.printStackTrace();
		}
	}
}
