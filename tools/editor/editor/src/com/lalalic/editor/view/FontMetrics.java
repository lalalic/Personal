package com.lalalic.editor.view;

import com.google.gwt.dom.client.Document;
import com.google.gwt.dom.client.Element;
import com.google.gwt.dom.client.Style;
import com.google.gwt.dom.client.Style.Display;
import com.google.gwt.dom.client.Style.Overflow;
import com.google.gwt.dom.client.Style.Position;
import com.google.gwt.dom.client.Style.Unit;
import com.google.gwt.dom.client.Style.WhiteSpace;

public class FontMetrics {
	private double height,width,baseline;
	public FontMetrics(){
		this("'Courier New', Courier, monospace",12);
	}
	
	public FontMetrics(String family, int size){
		Element el=Document.get().createDivElement();
		el.setAttribute("style", "font-family:"+family);
		Style style=el.getStyle();
		style.setPosition(Position.ABSOLUTE);
		style.setWhiteSpace(WhiteSpace.NOWRAP);
		style.setFontSize(size, Unit.PX);
		
		Document.get().getBody().appendChild(el);
		el.setInnerHTML("m");
		height=el.getOffsetHeight();
		width=el.getOffsetWidth();
		
		el.removeFromParent();
		
		el=Document.get().createSpanElement();
		style=el.getStyle();
		style.setDisplay(Display.INLINE_BLOCK);
		style.setOverflow(Overflow.HIDDEN);
		style.setWidth(1, Unit.PX);
		style.setHeight(1, Unit.PX);
		Document.get().getBody().appendChild(el);
		baseline=el.getOffsetTop()+el.getOffsetHeight();
		el.removeFromParent();
	}
	
	public double getHeight() {
		return height;
	}
	
	public double getWidth() {
		return width;
	}
	
	public double getBaseline(){
		return baseline;
	}
}
