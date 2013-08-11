package com.supernaiba.baas;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import android.content.Context;
import android.view.View;
import android.view.ViewGroup;

import com.parse.Magic;
import com.parse.ParseObject;
import com.parse.ParseQuery;
import com.parse.ParseQueryAdapter;

public class QueryAdapter<T> extends ParseQueryAdapter<T> {
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
			public ParseQuery<? extends ParseObject> create() {
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
	public void setTextKey(String textKey) {
		super.setTextKey(textKey);
		this.textKey=textKey;
	}

	@Override
	public View getItemView(ParseObject obj, View v, ViewGroup parent) {
		View view=super.getItemView(obj, v, parent);
		view.setTag(obj);
		return view;
	}
	
	public void append(T o){
		
	}
}
