package com.yy.app.tag;

import com.googlecode.objectify.Objectify;
import com.googlecode.objectify.ObjectifyService;
import com.googlecode.objectify.annotation.Index;
import com.googlecode.objectify.annotation.Unindex;
import com.yy.app.AModel;

@Unindex
public class TagEntity extends AModel {
	@Index
	public String entityType;
	@Index
	public Long entityID;
	@Index
	public Long tagID;
	public Integer order;
	public long count=0;
	
	@Override
	protected void prePersist() {
		super.prePersist();
		Objectify store=ObjectifyService.ofy();
		Tag tag=store.load().type(Tag.class).id(tagID).get();
		TagEntity tagEntity=store.load().type(TagEntity.class)
			.filter("entityType", this.entityType)
			.filter("entityID", 0).first().get();
		if(tagEntity==null){
			tagEntity=new TagEntity();
			tagEntity.entityID=0l;
			tagEntity.entityType=this.entityType;
		}
		tagEntity.count++;
		tag.count++;
		store.save().entities(tag,tagEntity).now();
	}
	
}
