package com.yy.app.test;

import java.util.ArrayList;
import java.util.Date;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import javax.persistence.Embedded;
import javax.persistence.Id;
import javax.persistence.Transient;
import javax.ws.rs.GET;
import javax.ws.rs.Path;
import javax.ws.rs.PathParam;
import javax.ws.rs.Produces;
import javax.ws.rs.core.MediaType;

import com.googlecode.objectify.ObjectifyService;
import com.googlecode.objectify.annotation.Unindexed;
import com.sun.jersey.api.view.Viewable;
import com.yy.app.site.Profile;

@Unindexed
public class Performance {
	public static final long UNKNOWN=-1l;
	@Transient
	private static final ThreadLocal<Performance> I = new ThreadLocal<Performance>();
	public static void log(String name, int level,long duration){
		if(Profile.I.trace)
			I.get().add(name,level,duration);
	}
	
	public static void setRequest(String url){
		if(Profile.I.trace){
			Performance p=new Performance();
			p.ID=Thread.currentThread().getId()+"."+System.nanoTime();
			p.request=url;
			p.when=new Date();
			p.add( "service.start",0,UNKNOWN);
			I.set(p);
			if(p.request.matches(".*/(perf|test).*"))
				p.ignore=true;
		}
	}
	
	public static void save(){
		if(Profile.I.trace){
			Performance p=I.get();
			
			if(p.ignore || p.items.size()<3)
				return;
			p.add("service.end",0,UNKNOWN);
			ObjectifyService.begin().put(I.get());
		}
	}
	
	@Id
	public String ID;
	
	public String request;
	
	public Date when;
	
	@Transient
	public boolean ignore;
	
	@Embedded
	@Unindexed
	public List<PerfItem> items=new ArrayList<PerfItem>();
	
	public void add(String name, int level, long duration){
		if(this.ignore)
			return;
		if(items.isEmpty())
			level=0;
		items.add(new PerfItem(name,level,duration));
	}
	
	public long itemDuration(PerfItem item){
		if(item.duration>0)
			return item.duration;
		
		int index=this.items.indexOf(item);
		if(index==0)
			return 0;
		int level=item.level;
		PerfItem nearestSameLevelItem=null;
		for(int i=index-1; i>-1 ; i--){
			if(items.get(i).level==level)
				nearestSameLevelItem=items.get(i);
		}
		if(nearestSameLevelItem==null)
			nearestSameLevelItem=items.get(index-1);
		return item.when-nearestSameLevelItem.when;
	}
		
	@Path("perf")
	public static class View{
		@GET
		@Produces(MediaType.TEXT_HTML)
		public Viewable list(){
			Map<String, Object> info = new HashMap<String, Object>();
			info.put("titleContent", "Performance");
			info.put("contentMacroName", "show");
			info.put("it", ObjectifyService.begin().query(Performance.class).list());
			return new Viewable("/perf/perf.html",info);
		}
		
		@GET
		@Path("remove/{ID:\\d+\\.\\d+}")
		@Produces(MediaType.APPLICATION_JSON)
		public boolean remove(@PathParam("ID")String ID){
			ObjectifyService.begin().delete(Performance.class, ID);
			return true;
		}
	}
}
