package com.supernaiba.widget;

import android.content.Context;
import android.graphics.drawable.Drawable;
import android.net.Uri;
import android.text.Spannable;
import android.text.SpannableStringBuilder;
import android.text.style.ImageSpan;
import android.util.AttributeSet;
import android.widget.EditText;

public class PostEditor extends EditText {
	public PostEditor(Context context, AttributeSet attrs, int defStyle) {
		super(context, attrs, defStyle);
		
		
	}
	
	public PostEditor(Context context, AttributeSet attrs) {
		super(context, attrs);
	}
	
	public PostEditor(Context context) {
		super(context);
	}
	
	public void insertImage(Uri uri){
		ImageSpan span=new ImageSpan(this.getContext(),uri);
		Drawable d=span.getDrawable();
		d.setBounds(0, 0, d.getIntrinsicWidth()/2, d.getIntrinsicHeight()/2);
		insertImage(span, uri.toString());
	}
	
	public void insertImage(ImageSpan imageSpan, String src){
		SpannableStringBuilder builder = new SpannableStringBuilder();
		builder.append(getText());
		String imgId = "<img src='"+src+"'>"; 

		int selStart = getSelectionStart();

		// current selection is replaceв with imageId
		builder.replace(getSelectionStart(), getSelectionEnd(), imgId);

		// this "replaces" imageId string with image span. If you do builder.toString() - the string will contain imageIs where the imageSpan is.
		// you can yse this later - if you want to location of imageSpan in text;
		builder.setSpan(imageSpan, selStart, selStart + imgId.length(), Spannable.SPAN_EXCLUSIVE_EXCLUSIVE);
		setText(builder);
	}
}
