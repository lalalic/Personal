package com.yy.app.tag;

import com.googlecode.objectify.Objectify;
import com.googlecode.objectify.ObjectifyService;
import com.googlecode.objectify.annotation.Indexed;
import com.googlecode.objectify.annotation.Unindexed;
import com.yy.app.AModel;

@Unindexed
public class TagEntity extends AModel {
	@Indexed
	public String entityType;
	@Indexed
	public Long entityID;
	@Indexed
	public Long tagID;
	public Integer order;
	public long count=0;
	
	@Override
	protected void prePersist() {
		super.prePersist();
		Objectify store=ObjectifyService.begin();
		Tag tag=store.get(Tag.class, tagID);
		TagEntity tagEntity=store.query(TagEntity.class)
			.filter("entityType", this.entityType)
			.filter("entityID", 0).get();
		if(tagEntity==null){
			tagEntity=new TagEntity();
			tagEntity.entityID=0l;
			tagEntity.entityType=this.entityType;
		}
		tagEntity.count++;
		tag.count++;
		store.put(tag,tagEntity);
	}
	
}
