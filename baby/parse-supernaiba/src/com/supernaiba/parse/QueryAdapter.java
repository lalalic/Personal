package com.supernaiba.parse;

import android.content.Context;
import android.view.View;
import android.view.ViewGroup;

import com.parse.ParseObject;
import com.parse.ParseQueryAdapter;

public class QueryAdapter<T extends ParseObject> extends ParseQueryAdapter<T> {

	public QueryAdapter(Context context,
			com.parse.ParseQueryAdapter.QueryFactory<T> queryFactory) {
		super(context, queryFactory);
		init(context);
	}

	public QueryAdapter(Context context, Class<? extends ParseObject> type){
		super(context,type);
		init(context);
	}
	
	public QueryAdapter(Context context, String type){
		super(context,type);
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
