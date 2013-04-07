package com.yy.app.test;

import java.util.ArrayList;
import java.util.Date;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import javax.ws.rs.GET;
import javax.ws.rs.Path;
import javax.ws.rs.PathParam;
import javax.ws.rs.Produces;
import javax.ws.rs.core.MediaType;

import com.googlecode.objectify.ObjectifyService;
import com.googlecode.objectify.annotation.Embed;
import com.googlecode.objectify.annotation.Entity;
import com.googlecode.objectify.annotation.Id;
import com.googlecode.objectify.annotation.Ignore;
import com.googlecode.objectify.annotation.Unindex;
import com.sun.jersey.api.view.Viewable;
import com.yy.app.site.Profile;

@Entity
public class Performance {
	public static final long UNKNOWN=-1l;
	@Ignore
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
			ObjectifyService.ofy().save().entity(I.get()).now();
		}
	}
	
	@Id
	public String ID;
	
	public String request;
	
	public Date when;
	
	@Ignore
	public boolean ignore;
	
	@Embed
	@Unindex
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
			info.put("it", ObjectifyService.ofy().load().type(Performance.class).list());
			return new Viewable("/perf/perf.html",info);
		}
		
		@GET
		@Path("remove/{ID:\\d+\\.\\d+}")
		@Produces(MediaType.APPLICATION_JSON)
		public boolean remove(@PathParam("ID")String ID){
			ObjectifyService.ofy().delete().type(Performance.class).id(ID).now();
			return true;
		}
	}
}
