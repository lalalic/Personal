package com.equ.app.travel;

import java.util.Date;

import com.google.appengine.api.datastore.GeoPt;
import com.googlecode.objectify.annotation.Unindexed;

@Unindexed
public class TimedPoint {
	public Date time;
	public GeoPt pt;
	public int type;

	public TimedPoint() {
	}

	public TimedPoint(Date time, GeoPt pt) {
		this.time = time;
		this.pt = pt;
	}

	@Override
	public String toString() {
		return new StringBuilder()
			.append("{lat:").append(pt.getLatitude())
			.append(",lng:").append(pt.getLongitude())
			.append(",when:").append(time.toString())
			.append("}")
			.toString();
		
	}

	@Override
	public int hashCode() {
		return (int)(time.getTime()/1000);
	}

	@Override
	public boolean equals(Object o) {
		return o!=null && this.hashCode()==o.hashCode();
	}
	
	
}
