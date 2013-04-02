package com.yy.msx;

import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.io.InputStream;
import java.util.HashMap;
import java.util.Map;
import java.util.zip.ZipEntry;
import java.util.zip.ZipInputStream;

import javax.xml.parsers.DocumentBuilder;
import javax.xml.parsers.DocumentBuilderFactory;

import org.w3c.dom.Element;
import org.w3c.dom.NodeList;

abstract public class Document {
	protected ZipInputStream raw;
	private Map<String, byte[]> parts;
	protected XMLParser xmlParser;
	protected Part main;
	
	public Document(InputStream in) {
		raw = new ZipInputStream(in);
		xmlParser=new XMLParser();
		parseDocument();
	}
	
	protected void parseDocument() {
		try {
			parts = new HashMap<String, byte[]>();
			ZipEntry entry = null;
			while (null != (entry = raw.getNextEntry())) {
				int i=0,c=0, size=(int)entry.getSize();
				byte[] data=new byte[size];
				while((c=raw.read(data, i, size-i))>0)
					i+=c;
				parts.put(entry.getName(), data);
				raw.closeEntry();
			}
		} catch (IOException e) {
			throw new RuntimeException(e);
		}
	}

	public void traverseWith(ModelBuilder builder){
		builder.rawDocument=this;
		builder.build(main.getDocument()).traverse(null);
	}

	private static class XMLParser {
		private DocumentBuilder builder;
		public Element parse(InputStream is) {
			try {
				if (builder == null)
					builder = DocumentBuilderFactory.newInstance()
							.newDocumentBuilder();
				return builder.parse(is).getDocumentElement();
			} catch (Exception e) {
				throw new RuntimeException(e);
			}
		}
	}
	
	public class Part{
		private String name, relName ;
		private Element doc;
		private Map<String, String> relIds;
		private Map<String, String> relTypes;
		
		public Part(String name){
			this.name=name;
			int i=this.name.lastIndexOf('/');
			if(i==-1)
				relName="_rels/"+name+".rels";
			else
				relName=this.name.substring(0,i)+"_rels/"+this.name.substring(i+1)+".rels";
		}
		
		public Element getDocument(){
			if(doc==null){	
				byte[] data = Document.this.parts.get(name);
				if (data == null)
					return null;
				doc=xmlParser.parse(new ByteArrayInputStream(data));
			}
			return doc;
		}
		
		private Map<String, String> getRels(){
			if(relIds==null){
				relIds=new HashMap<String, String>();
				relTypes=new HashMap<String, String>();
				byte[] data=parts.get(relName);
				if(data==null || data.length==0)
					return null;
				Element doc=xmlParser.parse(new ByteArrayInputStream(data));
				NodeList children=doc.getElementsByTagName("Relationship");
				for(int i=0, len=children.getLength(); i<len; i++){
					Element rel=(Element)children.item(i);
					relIds.put(rel.getAttribute("Id"), rel.getAttribute("Target"));
					relTypes.put(getType(rel.getAttribute("Type")), rel.getAttribute("Id"));
				}
			}
			return relIds;
		}
		
		protected String getRel(String id){
			return getRels().get(id);
		}
		
		protected String getRelByType(String type){
			getRels();
			return getRels().get(relTypes.get(type));
		}
		
		private String getType(String type){
			return type.substring(type.lastIndexOf('/')+1);
		}
	}
}
