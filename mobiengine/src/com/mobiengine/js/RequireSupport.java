package com.mobiengine.js;

import java.io.FileNotFoundException;
import java.io.IOException;
import java.io.InputStream;
import java.io.InputStreamReader;

import org.mozilla.javascript.Context;
import org.mozilla.javascript.Function;
import org.mozilla.javascript.Scriptable;
import org.mozilla.javascript.ScriptableObject;

public class RequireSupport extends ScriptableObject {
	private static final long serialVersionUID = -5946043632122729821L;

	@Override
	public String getClassName() {
		return "test";
	}

	public static void load(Context cx, Scriptable thisObj, Object[] args,
			Function funObj) throws FileNotFoundException, IOException {
		RequireSupport shell = (RequireSupport) getTopLevelScope(thisObj);
		for (int i = 0; i < args.length; i++) 
			shell.processSource(cx, Context.toString(args[i]));
	}

	private void processSource(Context cx, String filename)
			throws FileNotFoundException, IOException {
		cx.evaluateReader(this,
				new InputStreamReader(getInputStream(filename)), filename, 1,
				null);
	}

	private InputStream getInputStream(String file) throws IOException {
		return new ClassPathResource(file).getInputStream();
	}

}
