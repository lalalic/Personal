package com.lalalic.editor.view;

import org.timepedia.exporter.client.Export;
import org.timepedia.exporter.client.ExportPackage;

import com.google.gwt.canvas.client.Canvas;
import com.google.gwt.canvas.dom.client.Context2d;
import com.google.gwt.canvas.dom.client.Context2d.TextBaseline;
import com.google.gwt.canvas.dom.client.TextMetrics;
import com.google.gwt.dom.client.Element;
import com.google.gwt.event.dom.client.BlurEvent;
import com.google.gwt.event.dom.client.BlurHandler;
import com.google.gwt.event.dom.client.FocusEvent;
import com.google.gwt.event.dom.client.FocusHandler;
import com.google.gwt.event.dom.client.KeyCodes;
import com.google.gwt.event.dom.client.KeyPressEvent;
import com.google.gwt.event.dom.client.KeyPressHandler;
import com.google.gwt.event.dom.client.KeyUpEvent;
import com.google.gwt.event.dom.client.KeyUpHandler;
import com.google.gwt.user.client.DOM;
import com.google.gwt.user.client.Event;
import com.google.gwt.user.client.EventListener;
import com.lalalic.editor.model.Document;
import com.lalalic.editor.view.Selection.Location;

@ExportPackage("lala")
@Export
public class Editor extends View{
	private Element input;
	private Canvas canvas;
	private Document doc;
	private Selection selection;
	private FontMetrics metrics;
	private Context2d paint;
	
	public Editor(final Canvas canvas, Document doc){
		this.canvas=canvas;
		this.paint=this.canvas.getContext2d();
		this.paint.setFont("12px 'Courier New', Courier, monospace");
		this.paint.setTextBaseline(TextBaseline.BOTTOM);
		this.paint.setLineWidth(1);
		doc=doc!=null ? doc : new Document();
		setSelection(new Selection(this));
		metrics=new FontMetrics();
		draw(canvas);
		
		canvas.addFocusHandler(new FocusHandler(){
			@Override
			public void onFocus(FocusEvent focusevent) {
				selection.validate();
			}
		});
		
		canvas.addBlurHandler(new BlurHandler(){
			@Override
			public void onBlur(BlurEvent blurevent) {
				selection.invalid();
			}
			
		});
		
		canvas.addKeyUpHandler(new KeyUpHandler(){

			@Override
			public void onKeyUp(KeyUpEvent e) {
				switch(e.getNativeKeyCode()){
				case KeyCodes.KEY_BACKSPACE:
					deleteBack();
					break;
				case KeyCodes.KEY_LEFT:
					moveCursorBack();
					break;
				}
			}
			
		});
		
		canvas.addKeyPressHandler(new KeyPressHandler(){
			@Override
			public void onKeyPress(KeyPressEvent e) {
				selection.invalid();
				insertText(String.valueOf(e.getCharCode()));
				selection.validate();
			}
		});
	}
	
	protected void insertText(String text){
		TextMetrics tm=paint.measureText(text);
		Location start=selection.getStart();
		paint.fillText(text, start.x,start.y+metrics.getHeight());
		start.character=+text.length();
		start.x+=tm.getWidth();
		doc.buffer.append(text);
	}
	
	protected void deleteBack(){
		selection.invalid();
		Location start=selection.getStart();
		paint.clearRect(start.x-metrics.getWidth(), start.y, start.x, start.y+metrics.getHeight());
		doc.buffer.deleteCharAt(start.character);
		start.character--;
		start.x-=metrics.getWidth();
		selection.validate();
	}
	
	protected void moveCursorBack(){
		selection.invalid();
		Location start=selection.getStart();
		start.character--;
		start.x-=metrics.getWidth();
		selection.validate();
	}

	@Override
	protected void onDraw(Canvas canvas) {
		super.onDraw(canvas);
		this.selection.onDraw(canvas);
	}

	public FontMetrics getMetrics() {
		return metrics;
	}

	public Element getEl() {
		return null;
	}

	public void setSelection(Selection selection) {
		this.selection = selection;
	}

	public Selection getSelection() {
		return selection;
	}
	
	public Document getDoc() {
		return doc;
	}
	
	@SuppressWarnings("unused")
	private void createInput(){
		this.input=DOM.createTextArea();
		this.input.setAttribute("style", "position:absolute;top:-25px;left:-25px;height:10px;width:10px;");
		this.canvas.getCanvasElement().getParentElement().appendChild(this.input);
		DOM.setEventListener((com.google.gwt.user.client.Element) this.input.getParentElement(), new EventListener(){
			@Override
			public void onBrowserEvent(Event event) {
				if(event.getType().equals("input")){
					
				}
			}
			
		});
	}
	
	
	
}
