package com.supernaiba.widget;

import android.content.Context;
import android.util.AttributeSet;

import com.parse.ParseImageView;

public class CachableParseImageView extends ParseImageView {

	public CachableParseImageView(Context context, AttributeSet attributeSet,
			int defStyle) {
		super(context, attributeSet, defStyle);
	}
	
	public CachableParseImageView(Context context, AttributeSet attributeSet) {
		super(context, attributeSet);
	}

	public CachableParseImageView(Context context) {
		super(context);
	}
}
