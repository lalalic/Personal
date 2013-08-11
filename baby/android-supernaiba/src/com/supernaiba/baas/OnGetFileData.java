package com.supernaiba.baas;

import android.content.Context;
import android.widget.Toast;

import com.parse.GetDataCallback;
import com.parse.ParseException;
import com.parse.ParseFile;

public class OnGetFileData extends GetDataCallback {
	protected Context context;
	protected ParseFile target;
	public OnGetFileData(Context ctx,ParseFile o){
		context=ctx;
		target=o;
	}
	
	@Override
	public void done(byte[] data, ParseException ex) {
		if(ex!=null)
			Toast.makeText(context, ex.getMessage(), Toast.LENGTH_SHORT).show();
	}

}
