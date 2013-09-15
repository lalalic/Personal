package com.lalalic.editor.view;

import com.google.gwt.canvas.client.Canvas;
import com.google.gwt.canvas.dom.client.Context2d;
import com.google.gwt.user.client.Timer;

public class Selection extends View{
	public static final int INTERVAL=500;
	private Editor editor;
	public Location start=new Location(),end=new Location();
	private Timer timer;
	private Rect last=new Rect();
	private Context2d paint;
	public Selection(Editor editor){
		this.editor=editor;
	}

	public void onDraw(final Canvas canvas){
		if(timer==null){
			this.paint=canvas.getContext2d();
			start.x=canvas.getCanvasElement().getAbsoluteLeft();
			start.y=canvas.getCanvasElement().getAbsoluteTop();
			timer=new Timer(){
				@Override
				public void run() {
					double height=editor.getMetrics().getHeight();
					if(last.left!=-1){
						paint.clearRect(last.left,last.top, last.right,last.bottom);
						last.clear();
					}else{
						paint.beginPath();
						double w=paint.getLineWidth();
						paint.moveTo(start.x+w/2, start.y);
						paint.lineTo(start.x+w/2, start.y+height);
						last.set(start.x, start.y, start.x+w, start.y+height);
						paint.stroke();
					}
				}
			};
		}
		validate();
	}
	
	public void setStart(int start) {
		this.start.doc = start;
	}

	public Location getStart() {
		return start;
	}

	public void setEnd(int end) {
		this.end.doc = end;
	}

	public Location getEnd() {
		return end;
	}
	
	public void invalid(){
		if(last.left!=-1){
			paint.clearRect(last.left,last.top, last.right,last.bottom);
			last.clear();
		}
		this.timer.cancel();
	}
	
	public void validate(){
		this.timer.scheduleRepeating(INTERVAL);
	}

	public class Location{
		int doc;
		int line;
		int character;
		double x,y;
	}
	
	public class Rect{
		double left=-1, top=-1, right=-1,bottom=-1;
		public void set(double left, double top, double right, double bottom){
			this.left=left;
			this.top=top;
			this.right=right;
			this.bottom=bottom;
		}
		public void clear(){
			left=-1;
			top=-1; 
			right=-1;
			bottom=-1;
		}
	}
	
	
}
