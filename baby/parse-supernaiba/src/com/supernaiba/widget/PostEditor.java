package com.supernaiba.widget;

import greendroid.image.ImageRequest;
import greendroid.image.ImageRequest.ImageRequestCallback;

import java.io.ByteArrayOutputStream;

import android.annotation.TargetApi;
import android.content.Context;
import android.graphics.Bitmap;
import android.graphics.Bitmap.CompressFormat;
import android.graphics.BitmapFactory;
import android.graphics.Color;
import android.net.Uri;
import android.provider.MediaStore;
import android.text.Editable;
import android.text.Html;
import android.text.Layout.Alignment;
import android.text.Spannable;
import android.text.SpannableStringBuilder;
import android.text.style.AlignmentSpan;
import android.text.style.ForegroundColorSpan;
import android.text.style.ImageSpan;
import android.util.AttributeSet;
import android.view.KeyEvent;
import android.widget.EditText;

import com.parse.ParseException;
import com.parse.ParseFile;
import com.supernaiba.parse.OnSave;

public class PostEditor extends EditText implements ImageRequestCallback {
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
		case 67:
			if(start!=0){
				Editable text=getText();
				TitleEndSpan[] unremovables=text.getSpans(0, text.length(), TitleEndSpan.class);
				if(unremovables!=null && unremovables.length>0){
					int titleEnd=text.getSpanEnd(unremovables[0]);
					if(titleEnd>start){
						setSelection(titleEnd,titleEnd);
						return false;
					}
				}
			}
			break;
		case 66:
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
			s="Title\n";
			hintSpan=new ForegroundColorSpan(Color.GRAY);
		}
		Editable text=getText();
		int end=0;
		TitleEndSpan[] spans=text.getSpans(0, text.length(), TitleEndSpan.class);
		if(spans!=null && spans.length>0)
			end=text.getSpanEnd(spans[0]);
		Editable title=SpannableStringBuilder.valueOf(s);
		title.setSpan(new AlignmentSpan.Standard(Alignment.ALIGN_CENTER), 0, s.length(), Spannable.SPAN_INCLUSIVE_EXCLUSIVE);
		if(hintSpan!=null)
			title.setSpan(hintSpan, 0, s.length(), Spannable.SPAN_INCLUSIVE_EXCLUSIVE);
		title.setSpan(new TitleEndSpan(), s.length()-1, s.length(), Spannable.SPAN_EXCLUSIVE_EXCLUSIVE);
		this.getText().replace(0, end,title);
		return title;
	}

	public void insertImage(final Uri uri){
		Bitmap bitmap = getImage(uri);
		if(bitmap==null)
			return;
		final MyImageSpan span=new MyImageSpan(this.getContext(),bitmap, uri.toString());
		insertImage(span);

		ByteArrayOutputStream stream = new ByteArrayOutputStream();
		bitmap.compress(CompressFormat.JPEG, 100, stream);
		byte[] data = stream.toByteArray(); 
		final ParseFile file=new ParseFile("a.jpg",data);
		file.saveInBackground(new OnSave(getContext(),file){
			@Override
			public void done(ParseException ex) {
				super.done(ex);
				if(ex==null)
					span.setSource(file.getUrl());
			}
		});
	}
	
	@TargetApi(5)
	private Bitmap getImage(Uri uri){
		BitmapFactory.Options opt=new BitmapFactory.Options();
		opt.outHeight=384;
		opt.outWidth=512;
		Bitmap bitmap = MediaStore.Images.Thumbnails.getThumbnail(
                getContext().getContentResolver(), Long.parseLong(uri.getLastPathSegment()),
                MediaStore.Images.Thumbnails.MINI_KIND,
                opt );
		return bitmap;
	}

	public void insertImage(ImageSpan imageSpan){
		Editable text=getText();

		int start = getSelectionStart();
		int end=getSelectionEnd();
		text.replace(start, end, "\ufffc");
		
		end=start+1;
		text.setSpan(imageSpan, start, end, Spannable.SPAN_EXCLUSIVE_EXCLUSIVE);
		styleImage(text,imageSpan);
		setSelection(end, end);
	}
	
	public String getHTML(){
		StringBuilder html=new StringBuilder();
		Editable text=getText();
		int last=0, start, end;
		for(ImageSpan span: text.getSpans(last, text.length(), ImageSpan.class)){
			start=text.getSpanStart(span);
			end=text.getSpanEnd(span);
			html.append(text.subSequence(last, start));
			html.append("<img src=\"").append(span.getSource()).append("\">");
			last=end+1;
		}
		if(last<text.length())
			html.append(text.subSequence(last, text.length()-1));
		return html.substring(html.indexOf("\n")+1);
	}
	
	public void setText(String html){
		this.setText(Html.fromHtml(html));
		Editable text=getText();
		ImageSpan[] images=text.getSpans(0, text.length(), ImageSpan.class);
		styleImage(text,images);
		loadImages(text,images);
	}
	
	private void loadImages(Editable text, ImageSpan[] images) {
		for(ImageSpan span : images)
			new MyImageRequest(span).load(getContext());
	}

	public String getFirstImageUrl(){
		Editable text=getText();
		ImageSpan[] images=text.getSpans(0, text.length(), ImageSpan.class);
		if(images==null || images.length==0)
			return null;
		return images[0].getSource();
	}
	
	public String getTitle(){
		Editable text=getText();
		TitleEndSpan[] spans=text.getSpans(0, text.length(), TitleEndSpan.class);
		if(spans==null || spans.length==0)
			return "";
		int end=text.getSpanEnd(spans[0]);
		return text.subSequence(0, end).toString();
	}
	
	public void styleImage(Editable text, ImageSpan... images){
		for(ImageSpan span: images){
			int start=text.getSpanStart(span);
			int end=text.getSpanEnd(span);
			text.setSpan(new AlignmentSpan.Standard(Alignment.ALIGN_CENTER), start, end, Spannable.SPAN_EXCLUSIVE_EXCLUSIVE);
			//text.setSpan(new BulletSpan(), start, end, Spannable.SPAN_EXCLUSIVE_EXCLUSIVE);
			if(start>0 && text.charAt(start-1)!='\n')
				text.insert(start, "\n");
			if(text.length()==end || text.charAt(end)!='\n')
				text.insert(end, "\n");	
		}
	}
	
	private class TitleEndSpan{}
	
	private static class MyImageSpan extends ImageSpan{
		private String source;
		public MyImageSpan(Context context, Bitmap b, String src) {
			super(context, b);
			this.setSource(src);
		}
		public void setSource(String source) {
			this.source = source;
		}
		public String getSource() {
			return source;
		}
		
	}
	private class MyImageRequest extends ImageRequest{
		private ImageSpan holder;
		public MyImageRequest(ImageSpan span) {
			super(span.getSource(), PostEditor.this);
			holder=span;
		}
		
	}

	@Override
	public void onImageRequestStarted(ImageRequest request) {
		// TODO Auto-generated method stub
		
	}

	@Override
	public void onImageRequestFailed(ImageRequest request, Throwable throwable) {
		// TODO Auto-generated method stub
		
	}

	@Override
	public void onImageRequestEnded(ImageRequest request, Bitmap image) {
		ImageSpan placeholder=((MyImageRequest)request).holder;
		Editable text=getText();
		ImageSpan realImage=new ImageSpan(getContext(),image);
		text.setSpan(realImage, text.getSpanStart(placeholder), 
				text.getSpanEnd(placeholder), text.getSpanFlags(placeholder));
		text.removeSpan(placeholder);
	}

	@Override
	public void onImageRequestCancelled(ImageRequest request) {
		// TODO Auto-generated method stub
		
	}	
}
