package com.supernaiba.widget;

import java.io.ByteArrayOutputStream;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import android.annotation.TargetApi;
import android.content.Context;
import android.graphics.Bitmap;
import android.graphics.Bitmap.CompressFormat;
import android.graphics.BitmapFactory;
import android.graphics.Color;
import android.net.Uri;
import android.provider.MediaStore;
import android.text.Editable;
import android.text.Layout.Alignment;
import android.text.Spannable;
import android.text.SpannableStringBuilder;
import android.text.TextPaint;
import android.text.style.AlignmentSpan;
import android.text.style.BulletSpan;
import android.text.style.CharacterStyle;
import android.text.style.ForegroundColorSpan;
import android.text.style.ImageSpan;
import android.util.AttributeSet;
import android.view.KeyEvent;
import android.widget.EditText;

import com.parse.ParseException;
import com.parse.ParseFile;
import com.parse.SaveCallback;

public class PostEditor extends EditText {
	private static Pattern IMG=Pattern.compile("<img\\s+src=\\\"(.*)\\\">", Pattern.DOTALL|Pattern.CASE_INSENSITIVE);
	private ImageSaver imageSaver;
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
		
	}
	
	@Override
	public boolean onKeyDown(int keyCode, KeyEvent event) {
		int start=getSelectionStart();
		switch(keyCode){
		case 67://remove
			if(start!=0){
				TitleEndSpan[] unremovables=getText().getSpans(start-1, start-1, TitleEndSpan.class);
				if(unremovables!=null && unremovables.length>0){
					setSelection(start-1,start-1);
					return false;
				}
			}
			break;
		case 66://enter
			TitleEndSpan[] unremovables=getText().getSpans(start, start, TitleEndSpan.class);
			if(unremovables!=null && unremovables.length>0){
				setSelection(start+1,start+1);
				return false;
			}
			break;
		}
		return super.onKeyDown(keyCode, event);
	}

	public Editable setTitle(String s){
		ForegroundColorSpan hintSpan=null;
		if(s==null){
			s="Title here in first line\n";
			hintSpan=new ForegroundColorSpan(Color.GRAY);
		}
		Editable text=getText();
		int end=0;
		TitleEndSpan[] spans=text.getSpans(0, text.length(), TitleEndSpan.class);
		if(spans!=null && spans.length>0)
			end=text.getSpanEnd(spans[0]);
		Editable title=SpannableStringBuilder.valueOf(s);
		title.setSpan(new AlignmentSpan.Standard(Alignment.ALIGN_CENTER), 0, s.length()-1, Spannable.SPAN_INCLUSIVE_EXCLUSIVE);
		if(hintSpan!=null)
			title.setSpan(hintSpan, 0, s.length()-1, Spannable.SPAN_INCLUSIVE_EXCLUSIVE);
		title.setSpan(new TitleEndSpan(), s.length()-1, s.length()-1, Spannable.SPAN_EXCLUSIVE_EXCLUSIVE);
		this.getText().replace(0, end,title);
		return title;
	}

	@TargetApi(5)
	public void insertImage(Uri uri){
		Bitmap bitmap = MediaStore.Images.Thumbnails.getThumbnail(
                getContext().getContentResolver(), Long.parseLong(uri.getLastPathSegment()),
                MediaStore.Images.Thumbnails.MICRO_KIND,
                (BitmapFactory.Options) null );
		final ImageSpan span=new ImageSpan(this.getContext(),bitmap);
		insertImage(span, uri.toString());
		ByteArrayOutputStream stream = new ByteArrayOutputStream();
		bitmap.compress(CompressFormat.JPEG, 60, stream);
		byte[] data = stream.toByteArray();  
		final ParseFile file=new ParseFile("a.jpg",data);
		file.saveInBackground(new SaveCallback(){
			@Override
			public void done(ParseException ex) {
				if(ex==null){
					Editable text=getText();
					text.replace(text.getSpanStart(span), text.getSpanEnd(span), file.getUrl());
				}
			}
		});
		
	}

	public void insertImage(ImageSpan imageSpan, String src){
		SpannableStringBuilder builder = new SpannableStringBuilder();
		builder.append(getText());

		int start = getSelectionStart();
		int end=getSelectionEnd();
		builder.replace(start, end, src);
		
		end=start+src.length();
		builder.setSpan(imageSpan, start, end, Spannable.SPAN_EXCLUSIVE_EXCLUSIVE);
		builder.setSpan(new AlignmentSpan.Standard(Alignment.ALIGN_CENTER), start, end, Spannable.SPAN_EXCLUSIVE_EXCLUSIVE);
		builder.setSpan(new BulletSpan(), start, end, Spannable.SPAN_EXCLUSIVE_EXCLUSIVE);
		if(builder.charAt(start-1)!='\n')
			builder.insert(start, "\n");
		if(builder.length()==end || builder.charAt(end)!='\n')
			builder.insert(end, "\n");
		setText(builder);
		setSelection(end, end);
	}
	
	public String getHTML(ImageSaver saver){
		if(saver==null)
			saver=imageSaver;
		StringBuilder html=new StringBuilder();
		Editable text=getText();
		int last=0, start, end;
		String src;
		for(ImageSpan span: text.getSpans(last, text.length(), ImageSpan.class)){
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
		return html.substring(0, html.indexOf("\n"));
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
			builder.setSpan(span, start-1, builder.length()-1, Spannable.SPAN_PARAGRAPH);
			builder.setSpan(new AlignmentSpan.Standard(Alignment.ALIGN_CENTER), start-1, builder.length()-1,Spannable.SPAN_PARAGRAPH);
			last=end;
		}
		if(last<html.length())
			builder.append(html.subSequence(last, html.length()-1));
		
		this.setText(builder, BufferType.EDITABLE);
	}
	
	public void setImageSaver(ImageSaver saver){
		imageSaver=saver;
	}
	
	public interface ImageSaver{
		public String getURL(String sourceUri);
	}
	
	public String getFirstImageUrl(){
		Editable text=getText();
		ImageSpan[] images=text.getSpans(0, text.length(), ImageSpan.class);
		if(images==null || images.length==0)
			return null;
		return text.subSequence(text.getSpanStart(images[0]), text.getSpanEnd(images[0])).toString();
	}
	
	public String getTitle(){
		Editable text=getText();
		TitleEndSpan[] spans=text.getSpans(0, text.length(), TitleEndSpan.class);
		int end=text.getSpanEnd(spans[0]);
		return text.subSequence(0, end).toString();
	}
	
	private class TitleEndSpan extends CharacterStyle{

		@Override
		public void updateDrawState(TextPaint t) {
			
		}
		
	}
}
