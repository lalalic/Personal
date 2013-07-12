package com.supernaiba.widget;

import android.content.Context;
import android.graphics.Bitmap;
import android.graphics.drawable.Drawable;
import android.net.Uri;
import android.text.Spannable;
import android.text.SpannableStringBuilder;
import android.text.style.ImageSpan;
import android.util.AttributeSet;
import android.widget.EditText;

import com.supernaiba.R;

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
		d.setBounds(0, 0, d.getIntrinsicWidth()*2, d.getIntrinsicHeight()*2);
		int curpos = this.getSelectionStart();
		this.getText().insert(curpos, "\uFFFC");
		this.getText().setSpan(span,curpos,curpos+1,Spannable.SPAN_EXCLUSIVE_EXCLUSIVE);
	}
	
	public void insertImage(Bitmap bm){
		
		ImageSpan imageSpan = new ImageSpan(this.getContext().getResources().getDrawable(R.drawable.gd_action_bar_all_friends));
		if(bm!=null){
			imageSpan=new ImageSpan(bm);
			Drawable d=imageSpan.getDrawable();
			d.setBounds(0, 0, d.getIntrinsicWidth(), d.getIntrinsicHeight());
		}
		SpannableStringBuilder builder = new SpannableStringBuilder();
		builder.append(getText());

		// this is a string that will let you find a place, where the ImageSpan is.
		String imgId = "[img="+R.drawable.gd_action_bar_all_friends+"]"; 

		int selStart = getSelectionStart();

		// current selection is replaceв with imageId
		builder.replace(getSelectionStart(), getSelectionEnd(), imgId);

		// this "replaces" imageId string with image span. If you do builder.toString() - the string will contain imageIs where the imageSpan is.
		// you can yse this later - if you want to location of imageSpan in text;
		builder.setSpan(imageSpan, selStart, selStart + imgId.length(), Spannable.SPAN_EXCLUSIVE_EXCLUSIVE);
		setText(builder);
	}
}
