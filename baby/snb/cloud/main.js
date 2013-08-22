Array.prototype.each=function(f){for(var i=0,l=this.length;i<l;i++) f(this[i])}
function pad(a,len){
	return "000000000".substring(0,len).substring(a+"".length,len)+a
}
Date.prototype.dayInc=function(t,base){
	var now=parseInt(this.getFullYear()+pad(this.getMonth()+1,2)+pad(this.getDate()+1,2)+"0000")
	return base && base>now ? base+t : now+t
}
Date.prototype.weekInc=function(t,base){
	var d=new Date()
    d.setHours(0,0,0);
    d.setDate(d.getDate() + 4 - (d.getDay()||7));
    var yearStart = new Date(d.getFullYear(),0,1);
    var weekNo = Math.ceil(( ( (d - yearStart) / 86400000) + 1)/7)
    var now=d.getFullYear()+pad(weekNo,2)+"000000";
	return base && base>now ? base+t : now+t
}
Date.prototype.monthInc=function(t,base){
	var now=this.getFullYear()+pad(this.getMonth()+1,2)+"000000"
	return base && base>now ? base+t : now+t
}
Date.prototype.yearInc=function(t,base){
	var now=this.getFullYear()+"00000000"
	return base && base>now ? base+t : now+t
}

new Array("comment","story","post").each(function(f){
	Parse.Cloud.beforeSave(f, function(request, response) {
		if(request.object.isNew()){
			var o=request.object
			o.set("author",request.user.id)
			o.set("authorName",request.user.getUsername())
		}
		response.success()
	})
})

new Array("favorite","task").each(function(f){
	Parse.Cloud.beforeSave(f, function(request, response) {
		request.object.set("author",request.user.id)
		response.success()
	})
})


Parse.Cloud.afterSave("comment", function(request, response) {
	var post=request.object.get("post"),
		user=request.user
	post.increment("comments",1)
	post.save()
	
	user.increment("score",1)
	user.increment("comments",1)
	user.save()
});



Parse.Cloud.afterSave("story", function(request, response) {
	var story=request.object,
		post=story.get("post"),
		today=new Date(),
		user=request.user,
		t=user.get("duration")
		
	post.fetch({
		success: function(){
			var author=post.get("author")
			author.fetch({
				success: function(){
					author.increment("score",3)
					author.save()
				}
			})
			
			//tag beat
			if(post.has("tags")){
				var tags=post.get("tags"),
					Tag=Parse.Object.extend("tag")
				for(var i=0; i<tags.length;i++){
					(new Tag({id:tags[i]})).fetch({
						success: function(tag){
							tag.increment("stories",1)
							tag.set("dayBeat",today.dayInc(t,tag.get("dayBeat")))
							tag.set("weekBeat",today.weekInc(t,tag.get("weekBeat")))
							tag.set("monthBeat",today.monthInc(t,tag.get("monthBeat")))
							tag.set("yearBeat",today.yearInc(t,tag.get("yearBeat")))
							tag.increment("allBeat",t)
							tag.save()
						}
					})
				}
			}
			post.increment("stories",1)
			post.save()
		}
	})
		
	user.increment("stories",1)
	user.increment("score",5)
	user.set("dayBeat",today.dayInc(t,user.get("dayBeat")))
	user.set("weekBeat",today.weekInc(t,user.get("weekBeat")))
	user.set("monthBeat",today.monthInc(t,user.get("monthBeat")))
	user.set("yearBeat",today.yearInc(t,user.get("yearBeat")))
	user.increment("allBeat",t)
	user.save()
	
});

Parse.Cloud.afterSave("post", function(request, response) {
	var post=request.object
		user=request.user
	if(post.createdAt==post.updateddAt){//new
		user.increment("post",1)
		user.increment("score",10)
		user.save()
		
		//tag count;category, duration, goal, gender, and etc
		//tag beat
		if(post.has("tags")){
			var tags=post.get("tags"),
				Tag=Parse.Object.extend("tag")
			for(var i=0; i<tags.length;i++){
				(new Tag({id:tags[i]})).fetch({
					success: function(tag){
						tag.increment("posts",1)
						tag.increment("time",post.get("duration"))
						tag.save()
					}
				})
			}
		}
	}
});

