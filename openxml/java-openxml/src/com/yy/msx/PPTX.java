package com.yy.msx;

import java.io.InputStream;

public class PPTX extends Document{

	public PPTX(InputStream in) {
		super(in);
	}
	
	@Override
	protected void parseDocument(){
		super.parseDocument();
		main=new Part("ppt/presentation.xml");
	}	
	
	@SuppressWarnings("unused")
	private class Slide extends Part{
		Master master;
		Layout layout;
		Note note;
		public Slide(String name) {
			super(name);
			String partName=null;
			if((partName=this.getRelByType("slideLayout"))!=null)
				layout=new Layout(partName);
			
			if((partName=this.getRelByType("slideMaster"))!=null)
				master=new Master(layout.getRelByType("slideMaster"));
			
			if((partName=this.getRelByType("notesSlide"))!=null)
				note=new Note(this.getRelByType("notesSlide"));
		}
	}
	
	private class Master extends Part{

		public Master(String name) {
			super(name);
		}
		
	}
	
	private class Layout extends Part{

		public Layout(String name) {
			super(name);
		}
		
	}
	
	private class Note extends Part{

		public Note(String name) {
			super(name);
		}
		
	}
}
