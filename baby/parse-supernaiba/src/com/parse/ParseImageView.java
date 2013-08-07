package com.parse;

import greendroid.image.ImageRequest;
import greendroid.image.ImageRequest.ImageRequestCallback;
import android.content.Context;
import android.graphics.Bitmap;
import android.graphics.drawable.Drawable;
import android.util.AttributeSet;
import android.widget.ImageView;

import com.parse.GetDataCallback;
import com.parse.ParseFile;

public class ParseImageView extends ImageView {
	private ParseFile file;
	private Drawable placeholder;
	private boolean isLoaded;

	public ParseImageView(Context context) {
		super(context);
		isLoaded = false;
	}

	public ParseImageView(Context context, AttributeSet attributeSet) {
		super(context, attributeSet);
		isLoaded = false;
	}

	public ParseImageView(Context context, AttributeSet attributeSet,
			int defStyle) {
		super(context, attributeSet, defStyle);
		isLoaded = false;
	}

	protected void onDetachedFromWindow() {
		if (file != null)
			file.cancel();
	}

	public void setImageBitmap(Bitmap bitmap) {
		super.setImageBitmap(bitmap);
		isLoaded = true;
	}

	public void setPlaceholder(Drawable placeholder) {
		this.placeholder = placeholder;
		if (!isLoaded)
			setImageDrawable(this.placeholder);
	}

	public void setParseFile(ParseFile file) {
		if (this.file != null)
			this.file.cancel();
		isLoaded = false;
		this.file = file;
		setImageDrawable(placeholder);
	}

	public void loadInBackground() {
		loadInBackground(null);
	}

	public void loadInBackground(final GetDataCallback completionCallback) {
		if (file == null) {
			if (completionCallback != null)
				completionCallback.done(null, null);
		} else {
			new ImageRequest(file.getUrl(), new ImageRequestCallback() {
				@Override
				public void onImageRequestStarted(ImageRequest request) {
					// TODO Auto-generated method stub

				}

				@Override
				public void onImageRequestFailed(ImageRequest request,
						Throwable throwable) {
					// TODO Auto-generated method stub

				}

				@Override
				public void onImageRequestEnded(ImageRequest request,
						Bitmap bitmap) {
					if (!request.getUrl().equals(file.getUrl()))
						return;
					if (bitmap != null)
						setImageBitmap(bitmap);
				}

				@Override
				public void onImageRequestCancelled(ImageRequest request) {
					
				}
			}).load(getContext());
		}
	}
}
