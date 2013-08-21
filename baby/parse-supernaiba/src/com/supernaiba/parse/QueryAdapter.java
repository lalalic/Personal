package com.supernaiba.parse;

import greendroid.widget.LoaderActionBarItem;

import java.util.List;

import android.content.Context;
import android.graphics.drawable.Drawable;
import android.view.Gravity;
import android.view.View;
import android.view.ViewGroup;
import android.widget.LinearLayout;
import android.widget.TextView;

import com.parse.Magic;
import com.parse.ParseFile;
import com.parse.ParseImageView;
import com.parse.ParseObject;
import com.parse.ParseQuery;
import com.parse.ParseQueryAdapter;
import com.supernaiba.R;

public class QueryAdapter extends ParseQueryAdapter<ParseObject> {
	public final static int HOLDER=-1;
	private String textKey=null;
	private String imageKey=null;
	private Drawable placeholder=null;
	private int imageSize=150;
	LoaderActionBarItem refreshAction;
	protected Context context;
	public QueryAdapter(Context context, QueryFactory<ParseObject> queryFactory,LoaderActionBarItem refreshAction) {
		super(context, queryFactory);
		this.refreshAction=refreshAction;
		init(context);
	}

	public QueryAdapter(Context context, Class<? extends ParseObject> type){
		super(context,Magic.getClassName(type));
		init(context);
	}
	
	public QueryAdapter(Context context, final String type){
		super(context,new QueryFactory<ParseObject>(){

			@Override
			public ParseQuery<ParseObject> create() {
				Query<ParseObject> query=new Query<ParseObject>(type);
				query.orderByDescending("createdAt");
				return query;
			}
			
		});
		init(context);
	}
	
	protected void init(Context context){
		this.context=context;
		if(this.refreshAction!=null){
			addOnQueryLoadListener(new OnQueryLoadListener<ParseObject>(){

				@Override
				public void onLoaded(List<ParseObject> arg0, Exception arg1) {
					refreshAction.setLoading(false);
				}

				@Override
				public void onLoading() {
					refreshAction.setLoading(true);
				}
				
			});
		}
		setPlaceholder(context.getResources().getDrawable(R.drawable.gd_action_bar_compass));
		setPaginationEnabled(true);
	}
	
	@Override
	public void setTextKey(String textKey) {
		this.textKey=textKey;
		super.setTextKey(textKey);
	}
	
	@Override
	public void setImageKey(String imageKey){
		this.imageKey=imageKey;
		super.setImageKey(imageKey);
	}
	
	public void setPlaceholder(Drawable d){
		this.placeholder=d;
		super.setPlaceholder(d);
	}

	@Override
	public View getItemView(ParseObject object, View v, ViewGroup parent) {
		if (v == null)
			v = getDefaultView(context);
		Holder holder=(Holder) v.getTag(HOLDER);
		TextView textView=holder.text;
		
		if (textView != null && textKey!=null)
			textView.setText(object.get(textKey).toString());
		
		if (imageKey != null) {
			ParseImageView imageView=holder.image;
			imageView.setPlaceholder(placeholder);
			imageView.setParseFile((ParseFile) object.get(imageKey));
			imageView.loadInBackground();
		}
		v.setTag(object);
		return v;
	}
	
	@Override
	public View getNextPageView(View v, ViewGroup parent) {
		if (v == null)
			v = getDefaultView(context, true);
		TextView textView = ((Holder) v.getTag(HOLDER)).text;
		textView.setText("Load more...");
		return v;
	}
	
	private View getDefaultView(Context context){
		return getDefaultView(context,false);
	}
	
	protected View getDefaultView(Context context, boolean withTextAnyTime) {
		ParseImageView imageView=null;
		TextView textView=null;
		
		LinearLayout view = new LinearLayout(context);
		
		if(imageKey!=null){
			imageView = new ParseImageView(context);
			imageView.setId(android.R.id.icon);
			imageView.setLayoutParams(new android.widget.LinearLayout.LayoutParams(imageSize, imageSize));
			view.addView(imageView);
		}
		
		if(textKey!=null){
			view.setPadding(8, 4, 8, 4);
			textView = new TextView(context);
			textView.setId(android.R.id.text1);
			textView.setLayoutParams(new android.widget.LinearLayout.LayoutParams(
					android.widget.LinearLayout.LayoutParams.WRAP_CONTENT,
					android.widget.LinearLayout.LayoutParams.WRAP_CONTENT));
			textView.setPadding(8, 0, 0, 0);
			textView.setGravity(Gravity.CENTER_HORIZONTAL);
			view.addView(textView);
		}
		view.setTag(HOLDER, new Holder(imageView, textView));
		return view;
	}
	
	public void setImageSize(int size){
		imageSize=size;
	}
	
	public void append(ParseObject o){
		
	}
	
	private class Holder{
		ParseImageView image;
		TextView text;
		Holder(ParseImageView image, TextView text){
			this.image=image;
			this.text=text;
		}
	}
}
