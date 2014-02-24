package com.mobiengine.provider;

import javax.script.ScriptEngine;
import javax.script.ScriptEngineManager;
import javax.ws.rs.ext.ContextResolver;

public class JSEngine implements ContextResolver<ScriptEngine> {
	ScriptEngineManager engineFactory = new ScriptEngineManager();
	@Override
	public ScriptEngine getContext(Class<?> arg0) {
		return null;
	}

}
