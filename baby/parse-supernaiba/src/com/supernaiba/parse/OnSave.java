package com.supernaiba.parse;

import android.content.Context;
import android.widget.Toast;

import com.parse.ParseException;
import com.parse.SaveCallback;

public class OnSave extends SaveCallback {
	protected Context context;
	protected Object target;
	public OnSave(Context ctx,Object o){
		context=ctx;
		target=o;
	}
	@Override
	public void done(ParseException ex) {
		if(ex!=null)
			Toast.makeText(context, ex.getMessage(), Toast.LENGTH_SHORT).show();
	}

}
