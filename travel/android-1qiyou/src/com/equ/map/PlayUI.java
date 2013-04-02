package com.equ.map;

import android.content.Intent;
import android.os.Bundle;

import com.equ.R;
import com.google.android.maps.GeoPoint;
import com.google.android.maps.MapActivity;
import com.google.android.maps.MapView;
import com.yy.m.view.WebViewEx;

public class PlayUI extends MapActivity {
	MapView map;

	@Override
	protected void onCreate(Bundle saved) {
		super.onCreate(saved);
		this.setContentView(R.layout.play);

		map = (MapView) findViewById(R.id.mapview);
		map.getController().setCenter(new GeoPoint(-122284, 37422));
		map.setBuiltInZoomControls(true);

		Intent intent = this.getIntent();
		if (!intent.hasExtra("data"))
			return;
		String url = intent.getStringExtra("data");
		
		WebViewEx web=(WebViewEx)findViewById(R.id.data);
		web.setHome(this.getString(R.string.url_home)+url);
		web.loadHome();
	}

	protected boolean isRouteDisplayed() {
		// TODO Auto-generated method stub
		return false;
	}

}
