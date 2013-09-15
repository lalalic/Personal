package com.lalalic.sample.client;

import org.timepedia.exporter.client.ExporterUtil;

import com.google.gwt.canvas.client.Canvas;
import com.google.gwt.core.client.EntryPoint;
import com.google.gwt.user.client.ui.RootPanel;
import com.lalalic.editor.model.Document;
import com.lalalic.editor.view.Editor;

/**
 * Entry point classes define <code>onModuleLoad()</code>.
 */
public class Main implements EntryPoint {

	public void onModuleLoad() {
		ExporterUtil.exportAll();
		Canvas canvas=Canvas.createIfSupported();
		RootPanel.get("editor1").add(canvas);
		new Editor(canvas,new Document());
	}
}
