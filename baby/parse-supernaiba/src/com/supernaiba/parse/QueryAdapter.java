package com.supernaiba.parse;

import java.util.ArrayList;
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
	public void setTextKey(String textKey) {
		super.setTextKey(textKey);
		this.textKey=textKey;
	}

	@Override
	public View getItemView(T obj, View v, ViewGroup parent) {
		View view=super.getItemView(obj, v, parent);
		view.setTag(obj);
		return view;
	}

	@Override
	public void clear() {
		appended.clear();
		super.clear();
	}

	@Override
	public int getCount() {
		int count=super.getCount();
		for(List<T> list : appended.values())
			count+=list.size();
		return count++;
	}

	@Override
	public T getItem(int index) {
		if(appended.isEmpty())
			return super.getItem(index);
		else{
			int count=0;
			int minIndex=0;
			int maxIndex=0;
			for(int i : appended.keySet()){
				List<T> list=appended.get(i);
				minIndex=i+count;
				maxIndex=i+count+list.size()-1;
				
				if(index<minIndex)
					return super.getItem(index-count);
				else if (index>maxIndex)
					count+=list.size();
				else
					return list.get(index-minIndex);
			}
			return super.getItem(index-count);
		}
	}
	
	public void append(T o){
		int queryed=super.getCount();
		if(!appended.containsKey(queryed))
			appended.put(queryed, new ArrayList<T>());
		appended.get(queryed).add(o);
	}
}
