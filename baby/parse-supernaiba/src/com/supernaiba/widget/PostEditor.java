package com.supernaiba.widget;

import android.content.Context;
import android.text.Spanned;
import android.util.AttributeSet;
import android.widget.EditText;

public class PostEditor extends EditText {
	Spanned title;
	
	public PostEditor(Context context, AttributeSet attrs, int defStyle) {
		super(context, attrs, defStyle);
	}
	public PostEditor(Context context, AttributeSet attrs) {
		super(context, attrs);
	}
	public PostEditor(Context context) {
		super(context);
	}
	
}
