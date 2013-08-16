package com.supernaiba.parse;

import greendroid.widget.LoaderActionBarItem;

import java.util.List;

import android.content.Context;
import android.view.View;
import android.view.ViewGroup;

import com.parse.Magic;
import com.parse.ParseImageView;
import com.parse.ParseObject;
import com.parse.ParseQuery;
import com.parse.ParseQueryAdapter;
import com.supernaiba.R;

public class QueryAdapter<T extends ParseObject> extends ParseQueryAdapter<T> {
	private String textKey=null;
	LoaderActionBarItem refreshAction;
	protected Context context;
	public QueryAdapter(Context context, QueryFactory<T> queryFactory,LoaderActionBarItem refreshAction) {
		super(context, queryFactory);
		this.refreshAction=refreshAction;
		init(context);
	}

	public QueryAdapter(Context context, Class<? extends ParseObject> type){
		super(context,Magic.getClassName(type));
		init(context);
	}
	
	public QueryAdapter(Context context, final String type){
		super(context,new QueryFactory<T>(){

			@Override
			public ParseQuery<T> create() {
				Query<T> query=new Query<T>(type);
				query.orderByDescending("createdAt");
				return query;
			}
			
		});
		init(context);
	}
	
	protected void init(Context context){
		this.context=context;
		if(this.refreshAction!=null){
			addOnQueryLoadListener(new OnQueryLoadListener<T>(){

				@Override
				public void onLoaded(List<T> arg0, Exception arg1) {
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
		super.setTextKey(textKey);
		this.textKey=textKey;
	}

	@Override
	public View getItemView(T obj, View v, ViewGroup parent) {
		boolean first=false;
		if(v==null){
			first=true;
			if(textKey==null)
				v=getDefaultView(parent.getContext());
		}
		View view=super.getItemView(obj, v, parent);
		if(first){
			ParseImageView imageView=(ParseImageView)view.findViewById(android.R.id.icon);
			if(imageView!=null)
				imageView.setLayoutParams(new android.widget.LinearLayout.LayoutParams(150, 150));
		}
		view.setTag(obj);
		return view;
	}
	
	protected View getDefaultView(Context context){
		ParseImageView imageView = new ParseImageView(context);
		imageView.setId(android.R.id.icon);
		return imageView;
	}
	
	public void append(T o){
		
	}
}
