package com.lalalic.editor.view;

import com.google.gwt.canvas.client.Canvas;

public abstract class View {
	public void draw(Canvas canvas){
		//background
		//content
		onDraw(canvas);
		//children
		dispatchDraw(canvas);
		//scrollbar
		onDrawScrollBars(canvas);
	}
	
	protected void onDraw(Canvas canvas){
		
	}
	protected void dispatchDraw(Canvas canvas){
		
	}
	protected void onDrawScrollBars(Canvas canvas){
		
	}
	
}
