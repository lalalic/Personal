package com.yy.msx.docx.out.html;

import java.io.OutputStream;

import javax.xml.parsers.DocumentBuilderFactory;

import org.w3c.dom.DOMConfiguration;
import org.w3c.dom.Node;
import org.w3c.dom.css.CSSStyleSheet;
import org.w3c.dom.ls.DOMImplementationLS;
import org.w3c.dom.ls.LSOutput;
import org.w3c.dom.ls.LSSerializer;

import com.yy.css.CSSImplementation;
import com.yy.msx.Model;
import com.yy.msx.docx.DocxModelBuilder;

public class HtmlConverterBuilder extends DocxModelBuilder {
	protected org.w3c.dom.Document convertedDocument;
	protected CSSImplementation cssImpl;
	protected CSSStyleSheet stylesheet;

	public HtmlConverterBuilder() {
		super();
		try {
			convertedDocument = DocumentBuilderFactory.newInstance()
					.newDocumentBuilder().newDocument();
			cssImpl=new CSSImplementation();
			stylesheet=cssImpl.createCSSStyleSheet(null, null);
		} catch (Exception e) {
			e.printStackTrace();
		}
	}
	
	@Override
	public StyleBuilder getStyleBuilder(){
		if(styleBuilder==null)
			styleBuilder=new CSSConverterBuilder();
		return styleBuilder;
	}
	
	@Override
	protected Model instance(String type, Node c){
		Model m=super.instance(type, c);
		if(m==null)
			m=new Converter(c);
		((Converter)m).convertedDoc=convertedDocument;
		return m;
	}

	public org.w3c.dom.Document getConvertedDocument() {
		return convertedDocument;
	}

	public void output(OutputStream out)
			throws Exception {
		DOMImplementationLS factory = (DOMImplementationLS) convertedDocument
				.getImplementation();
		LSOutput output = factory.createLSOutput();
		output.setByteStream(out);
		LSSerializer serializer = factory.createLSSerializer();
		DOMConfiguration config = serializer.getDomConfig();

		config.setParameter("format-pretty-print", Boolean.TRUE);
		config.setParameter("xml-declaration", Boolean.FALSE);
		config.setParameter("comments", Boolean.TRUE);
		serializer.write(convertedDocument, output);
	}
	
	public class CSSConverterBuilder extends StyleBuilder{
		protected CSSConverterBuilder() {
			super();
			modelContainer+=".css";
		}
	}
}
