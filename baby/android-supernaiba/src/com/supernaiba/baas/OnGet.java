package com.supernaiba.baas;

import android.content.Context;
import android.widget.Toast;

import com.parse.GetCallback;
import com.parse.ParseException;
import com.parse.ParseObject;

public class OnGet<T extends ParseObject> extends GetCallback<T> {
	protected Context context;
	public OnGet(Context ctx){
		context=ctx;
	}
	@Override
	public void done(T o, ParseException ex) {
		if(ex!=null){
			switch(ex.getCode()){
			case ParseException.OBJECT_NOT_FOUND:
				ex=null;
				break;
			default:
				Toast.makeText(context, ex.getMessage(), Toast.LENGTH_SHORT).show();
				return;
			}
		}
		
	}

}
