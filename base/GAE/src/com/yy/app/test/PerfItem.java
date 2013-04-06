package com.yy.app.test;

import com.googlecode.objectify.annotation.Unindex;

@Unindex
public class PerfItem{
	public String name;
	public long when;
	public long duration=Performance.UNKNOWN;
	public int level;
	
	public PerfItem(){}
	public PerfItem(String name, int level, long duration){
		this.name=name;
		this.when=System.currentTimeMillis();
		this.level=level;
		this.duration=duration;
	}
}