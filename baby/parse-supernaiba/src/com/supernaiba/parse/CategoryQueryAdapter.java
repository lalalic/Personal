package com.supernaiba.parse;

import greendroid.widget.LoaderActionBarItem;
import android.content.Context;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;

import com.parse.ParseObject;
import com.supernaiba.R;

public class CategoryQueryAdapter<T extends ParseObject> extends QueryAdapter<T> {
	public final static int STATISTICS=2;
	private T statistics;
	private View statView;
	
	public CategoryQueryAdapter(Context context, QueryFactory<T> queryFactory, LoaderActionBarItem refreshAction) {
		super(context, queryFactory,refreshAction);
		this.refreshAction=refreshAction;
	}
	
	@Override
	protected void init(Context context){
		super.init(context);
	}

	@Override
	public int getCount() {
		return super.getCount()+1;
	}

	@Override
	public T getItem(int index) {
		if(index==0)
			return statistics; 
		return super.getItem(index-1);
	}

	@Override
	public long getItemId(int position) {
		if(position==0)
			return 0;
		return super.getItemId(position-1);
	}

	@Override
	public int getItemViewType(int position) {
		if(position==0)
			return STATISTICS;
		return super.getItemViewType(position-1);
	}

	@Override
	public View getItemView(T obj, View v, ViewGroup parent) {
		if(obj==statistics)
			return statView;
		return super.getItemView(obj, v, parent);
	}

	@Override
	public int getViewTypeCount() {
		return super.getViewTypeCount()+1;
	}

	public void setStatisitcs(T data){
		this.statistics=data;
		LayoutInflater inflater=(LayoutInflater)context.getSystemService(Context.LAYOUT_INFLATER_SERVICE);
		statView=inflater.inflate(R.layout.cat_statistics,null);
	}
	
}
