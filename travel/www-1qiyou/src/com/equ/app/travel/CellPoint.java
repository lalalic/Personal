package com.equ.app.travel;

import javax.persistence.Id;

import com.google.appengine.api.datastore.GeoPt;
import com.googlecode.objectify.annotation.Unindexed;

@Unindexed
public class CellPoint {
	@Id
	public String ID;//"cellID,lac"
	public GeoPt pt;
	public CellPoint(){}
	public CellPoint(String ID, GeoPt latlng){
		this.ID=ID;
		this.pt=latlng;
	}
}
