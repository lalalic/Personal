package com.equ.app.travel;

import com.google.appengine.api.datastore.GeoPt;
import com.googlecode.objectify.annotation.Entity;
import com.googlecode.objectify.annotation.Id;

@Entity
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
