package com.supernaiba.widget;

import android.content.Context;
import android.graphics.Color;
import android.graphics.drawable.Drawable;
import android.net.Uri;
import android.text.Editable;
import android.text.Layout.Alignment;
import android.text.Spannable;
import android.text.SpannableStringBuilder;
import android.text.TextWatcher;
import android.text.style.AlignmentSpan;
import android.text.style.ForegroundColorSpan;
import android.text.style.ImageSpan;
import android.util.AttributeSet;
import android.widget.EditText;

public class PostEditor extends EditText {
	Editable title;
	public PostEditor(Context context, AttributeSet attrs, int defStyle) {
		super(context, attrs, defStyle);
		init();
	}
	
	public PostEditor(Context context, AttributeSet attrs) {
		super(context, attrs);
		init();
	}
	
	public PostEditor(Context context) {
		super(context);
		init();
	}
	
	protected void init(){
		this.addTextChangedListener(new MyTextWatcher());
	}
	
	public Editable setTitle(String s){
		ForegroundColorSpan hintSpan=null;
		if(s==null){
			s="Title here in first line\n";
			hintSpan=new ForegroundColorSpan(Color.GRAY);
		}
		if(title==null)
			title=SpannableStringBuilder.valueOf(s);
		else
			title.clear();
		title.clearSpans();
		title.setSpan(new AlignmentSpan.Standard(Alignment.ALIGN_CENTER), 0, s.length()-1, Spannable.SPAN_EXCLUSIVE_EXCLUSIVE);
		if(hintSpan!=null)
			title.setSpan(hintSpan, 0, s.length()-1, Spannable.SPAN_EXCLUSIVE_EXCLUSIVE);
		this.getText().insert(0, title);
		return title;
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
	
	private class MyTextWatcher implements TextWatcher{

		@Override
		public void afterTextChanged(Editable editable) {
			if(editable==title){
				if(title.length()==0)
					title.append(" ");
			}
		}

		@Override
		public void beforeTextChanged(CharSequence charsequence, int i, int j,
				int k) {
			
		}

		@Override
		public void onTextChanged(CharSequence charsequence, int i, int j, int k) {
			
		}
		
	}
}
