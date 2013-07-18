package com.supernaiba.widget;

import java.util.regex.Matcher;
import java.util.regex.Pattern;

import android.annotation.TargetApi;
import android.content.Context;
import android.graphics.Bitmap;
import android.graphics.BitmapFactory;
import android.graphics.Color;
import android.graphics.drawable.Drawable;
import android.net.Uri;
import android.provider.MediaStore;
import android.text.Editable;
import android.text.Layout.Alignment;
import android.text.Spannable;
import android.text.SpannableStringBuilder;
import android.text.style.AlignmentSpan;
import android.text.style.ForegroundColorSpan;
import android.text.style.ImageSpan;
import android.util.AttributeSet;
import android.widget.EditText;

public class PostEditor extends EditText {
	Pattern IMG=Pattern.compile("<img\\s+src=\\\"(.*)\\\">", Pattern.DOTALL|Pattern.CASE_INSENSITIVE);
	Editable title;
	public PostEditor(Context context, AttributeSet attrs, int defStyle) {
		super(context, attrs, defStyle);
	}
	
	public PostEditor(Context context, AttributeSet attrs) {
		super(context, attrs);
	}
	
	public PostEditor(Context context) {
		super(context);
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
	
	@TargetApi(5)
	public void insertImage(Uri uri){
		Bitmap bitmap = MediaStore.Images.Thumbnails.getThumbnail(
                getContext().getContentResolver(), Long.parseLong(uri.getLastPathSegment()),
                MediaStore.Images.Thumbnails.MICRO_KIND,
                (BitmapFactory.Options) null );
		ImageSpan span=new ImageSpan(this.getContext(),bitmap);
		Drawable d=span.getDrawable();
		d.setBounds(0, 0, d.getIntrinsicWidth()/2, d.getIntrinsicHeight()/2);
		insertImage(span, uri.toString());
	}
	
	public void insertImage(ImageSpan imageSpan, String src){
		SpannableStringBuilder builder = new SpannableStringBuilder();
		builder.append(getText());
		String imgId = "\n"+src+"\n"; 

		int selStart = getSelectionStart();
		int selEnd=getSelectionEnd();
		builder.replace(selStart, selEnd, imgId);
		builder.setSpan(imageSpan, selStart+1, selStart + imgId.length()-1, Spannable.SPAN_EXCLUSIVE_EXCLUSIVE);
		builder.setSpan(new AlignmentSpan.Standard(Alignment.ALIGN_CENTER), selStart+1, selStart + imgId.length()-1, Spannable.SPAN_EXCLUSIVE_EXCLUSIVE);
		//builder.setSpan(new BulletSpan(2), selStart + imgId.length(), selStart + imgId.length(), Spannable.SPAN_EXCLUSIVE_EXCLUSIVE);
		setText(builder);
		setSelection(selStart+imgId.length(), selStart+imgId.length());
	}	
	
	public String getHTML(ImageSaver saver){
		StringBuilder html=new StringBuilder();
		Editable text=getText();
		int last=0, start, end;
		String src;
		for(ImageSpan span: text.getSpans(0, text.length(), ImageSpan.class)){
			start=text.getSpanStart(span);
			end=text.getSpanEnd(span);
			html.append(text.subSequence(last, start));
			src=text.subSequence(start,end).toString();
			if(src.toLowerCase().startsWith("content:") && saver!=null)
				html.append("<img src=\"").append(saver.getURL(src)).append("\">");
			else
				html.append("<img src=\"").append(src).append("\">");
			last=end+1;
		}
		if(last<text.length())
			html.append(text.subSequence(last, text.length()-1));
		return html.toString();
	}
	
	public void setText(String html){
		SpannableStringBuilder builder = new SpannableStringBuilder();
		Matcher matcher=IMG.matcher(html);
		String src;
		int last=0,start,end;
		ImageSpan span;
		while(matcher.find()){
			start=matcher.start();
			end=matcher.end();
			src=matcher.group(1);
			builder.append(html.subSequence(last, start));
			span=new ImageSpan(getContext(),Uri.parse(src));
			start=builder.length();
			builder.append(src);
			builder.setSpan(span, start-1, builder.length()-1, Spannable.SPAN_EXCLUSIVE_EXCLUSIVE);
			builder.setSpan(new AlignmentSpan.Standard(Alignment.ALIGN_CENTER), start-1, builder.length()-1,Spannable.SPAN_EXCLUSIVE_EXCLUSIVE);
			last=end;
		}
		if(last<html.length())
			builder.append(html.subSequence(last, html.length()-1));
		
		this.setText(builder, BufferType.EDITABLE);
	}
	
	public interface ImageSaver{
		public String getURL(String uri);
	}
}
