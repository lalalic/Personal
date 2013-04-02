package com.minicheers.app.homeassit;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import javax.persistence.PostLoad;
import javax.persistence.Transient;

import com.googlecode.objectify.ObjectifyService;
import com.googlecode.objectify.annotation.Entity;
import com.yy.app.cms.Post;
import com.yy.app.cms.Slave;

@Entity(name = "HomeAssistant_Share")
public class Share extends Slave {
	@Transient public Map<String, Integer> serviceRating;
	public List<String> __serviceRating;

	public List<String> getServices() {
		return ObjectifyService.begin().get(HomeAssistant.class, this.parent).services;
	}
	
	@Override
	protected void prePersist() {
		super.prePersist();
		if(serviceRating!=null){
			__serviceRating=new ArrayList<String>();
			for(String key : serviceRating.keySet())
				__serviceRating.add(key+";"+serviceRating.get(key));
		}
	}

	@PostLoad
	protected void postLoad(){
		if(__serviceRating!=null){
			serviceRating=new HashMap<String,Integer>();
			for(String item : __serviceRating){
				String[] data=item.split(";");
				serviceRating.put(data[0], Integer.parseInt(data[1]));
			}
		}
	}

	public static class View extends Post.View {

	}
}
