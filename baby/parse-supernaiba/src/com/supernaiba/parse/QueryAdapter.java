package com.supernaiba.parse;

import android.content.Context;
import android.view.View;
import android.view.ViewGroup;

import com.parse.Magic;
import com.parse.ParseObject;
import com.parse.ParseQuery;
import com.parse.ParseQueryAdapter;

public class QueryAdapter<T extends ParseObject> extends ParseQueryAdapter<T> {

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
				@SuppressWarnings({ "rawtypes", "unchecked" })
				Query<T> query=new Query(type);
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
	public View getItemView(T obj, View v, ViewGroup parent) {
		View view=super.getItemView(obj, v, parent);
		view.setTag(obj);
		return view;
	}
	
	
	
}
