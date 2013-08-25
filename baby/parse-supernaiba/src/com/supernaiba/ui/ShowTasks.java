package com.supernaiba.ui;

import android.os.Bundle;

import com.parse.ParseObject;
import com.parse.ParseUser;
import com.supernaiba.R;
import com.supernaiba.parse.Query;

public class ShowTasks extends ShowFavorites {
	/** Called when the activity is first created. */
	public void onCreate(Bundle savedInstanceState) {
		title=R.string.tasks;
		super.onCreate(savedInstanceState);	
		this.setTitle(R.string.tasks);
	}

	@Override
	protected Query<ParseObject> createQuery() {
		adapter.setTextKey("title");
		adapter.setImageKey("thumbnail");
		
		Query<ParseObject> query=new Query<ParseObject>("task");
		query.whereEqualTo("owner", ParseUser.getCurrentUser().getObjectId());
		return query;
	}
}
