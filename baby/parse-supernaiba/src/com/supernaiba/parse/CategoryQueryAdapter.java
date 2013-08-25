package com.supernaiba.parse;

import greendroid.widget.LoaderActionBarItem;
import android.content.Context;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.Button;
import android.widget.TextView;

import com.parse.ParseImageView;
import com.parse.ParseObject;
import com.supernaiba.R;

public class CategoryQueryAdapter extends QueryAdapter {
	public final static int STATISTICS=2;
	private ParseObject statistics;
	private View statView;
	
	public CategoryQueryAdapter(Context context, QueryFactory<ParseObject> queryFactory, LoaderActionBarItem refreshAction) {
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
	public ParseObject getItem(int index) {
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
	public View getItemView(ParseObject obj, View v, ViewGroup parent) {
		if(obj==statistics)
			return statView;
		return super.getItemView(obj, v, parent);
	}

	@Override
	public int getViewTypeCount() {
		return super.getViewTypeCount()+1;
	}

	public void setStatisitcs(ParseObject data){
		this.statistics=data;
		LayoutInflater inflater=(LayoutInflater)context.getSystemService(Context.LAYOUT_INFLATER_SERVICE);
		statView=inflater.inflate(R.layout.cat_statistics,null);
	}
	
	@Override
	protected View getDefaultView(Context context, boolean withTextAnyTime) {
		LayoutInflater inflater=(LayoutInflater)context.getSystemService(Context.LAYOUT_INFLATER_SERVICE);
		View v=inflater.inflate(R.layout.listview1, null);
		ListView1Holder holder=new ListView1Holder(
				(ParseImageView)v.findViewById(android.R.id.icon),
				(TextView)v.findViewById(android.R.id.text1),
				(TextView)v.findViewById(R.id.desc),
				(Button)v.findViewById(R.id.shortcut));
		v.setTag(HOLDER, holder);
		return v;
		
	}
	
	protected class ListView1Holder extends Holder{
		TextView desc;
		Button shortcut;
		ListView1Holder(ParseImageView image, TextView title, TextView desc, Button shortcut) {
			super(image, title);
			this.desc=desc;
			this.shortcut=shortcut;
		}
		
	}
}
