package com.mobiengine.js;

import java.io.FileNotFoundException;
import java.io.IOException;

import org.mozilla.javascript.Context;
import org.mozilla.javascript.Function;
import org.mozilla.javascript.Scriptable;
import org.mozilla.javascript.ScriptableObject;

public class RequireSupport extends ScriptableObject {
	private static final long serialVersionUID = -5946043632122729821L;

	@Override
	public String getClassName() {
		return "Require";
	}

	public static void load(Context cx, Scriptable thisObj, Object[] args,
			Function funObj) throws FileNotFoundException, IOException {
		RequireSupport shell = (RequireSupport) getTopLevelScope(thisObj);
		for (int i = 0; i < args.length; i++) 
			shell.load(cx, Context.toString(args[i]));
	}

	private void load(Context cx, String filename)
			throws FileNotFoundException, IOException {
		cx.evaluateReader(this, Cloud.getJSFileReader(filename), filename, 1,null);
	}
}
