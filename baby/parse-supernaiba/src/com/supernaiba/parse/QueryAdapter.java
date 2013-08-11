package com.supernaiba.parse;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import android.content.Context;
import android.view.View;
import android.view.ViewGroup;

import com.parse.Magic;
import com.parse.ParseImageView;
import com.parse.ParseObject;
import com.parse.ParseQuery;
import com.parse.ParseQueryAdapter;

public class QueryAdapter<T extends ParseObject> extends ParseQueryAdapter<T> {
	private String textKey=null;
	protected Map<Integer,List<T>> appended=new LinkedHashMap<Integer,List<T>>();
	public QueryAdapter(Context context, QueryFactory<T> queryFactory) {
		super(context, queryFactory);
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
		setPlaceholder(context.getResources().getDrawable(android.R.drawable.gallery_thumb));
		setPaginationEnabled(true);
		setObjectsPerPage(20);
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
