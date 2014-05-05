function error(e){console.warn(e)}
function isNewCreated(o){return o.get('createdAt').getTime()==o.get('updatedAt').getTime()}
function pad(a,len){return "000000000".substring(0,len).substring(a+"".length,len)+a}
var DATE=function(d){this._date=d||new Date()}
_.each('FullYear,Month,Date,Time'.split(','),function(a){
	this['get'+a]=_.bind(Date.prototype['get'+a],this._date)
},_.extend(DATE.prototype,{
	toDay:function(){
		return parseInt(this.getFullYear()+pad(this.getMonth()+1,2)+'00'+pad(this.getDate()+1,2))
	},
	toWeek:function(){
		var d=new Date()
		d.setTime(this.getTime())
		d.setHours(0,0,0);
		d.setDate(d.getDate() + 4 - (d.getDay()||7));
		var yearStart = new Date(d.getFullYear(),0,1);
		var weekNo = Math.ceil(( ( (d - yearStart) / 86400000) + 1)/7)
		return parseInt(d.getFullYear()+"00"+pad(weekNo,2)+"00")
	},
	toMonth:function(){
		return parseInt(this.getFullYear()+pad(this.getMonth()+1,2)+"0000")
	},
	toYear:function(){
		return parseInt(this.getFullYear()+"000000")
	},
	dayInc:function(t,base){
		var now=parseInt(this.toDay()+"0000")
		return base && base>now ? base+t : now+t
	},
	weekInc:function(t,base){
		var now=parseInt(this.toWeek()+"0000");
		return base && base>now ? base+t : now+t
	},
	monthInc:function(t,base){
		var now=parseInt(this.toMonth()+"0000")
		return base && base>now ? base+t : now+t
	},
	yearInc:function(t,base){
		var now=parseInt(this.toYear()+"0000")
		return base && base>now ? base+t : now+t
	},
	tomorrow:function(){
		this.setTime(this.getTime()+24*60*60*1000)
		return this
	}
}))

var Tag=Model.extend({className:'Tag'})
_.each(["Comment","Story","Post","Favorite",'Child',"Task"],function(f){
	Cloud.beforeSave(f, function(request, response) {
		if(!request.object.isNew()) return
		var o=request.object,
			user=request.user,
			r=response.object
		o.set("author",r.author=user.id)
		o.set("authorName",r.authorName=user.get("username"))
	})
})

Cloud.afterSave("Comment", function(request, response) {
	var user=request.user,
		comment=request.object
	Model.create(comment.get('kind'),{id:comment.get("parent")})
		.fetch()
		.then(function(parent){
			parent.increment("comments",1)
			parent.save()
		})
	
	user.increment("score",1)
	user.increment("comments",1)
	user.save()
});

Cloud.afterSave("Post", function(request, response) {
	var post=request.object,
		user=request.user
	if(!isNewCreated(post))
		return
	user.increment("post",1)
	user.increment("score",10)
	user.save()

	//tag count;category, duration, goal, gender, and etc
	var tags=Tag.collection()
	_.each(post.get('tags'),function(id){
		new Tag({id:id}).fetch().then(function(tag){
			tag.increment('posts',1)
			post.has('duration') && tag.increment('time', post.get('duration'))
			tags.add(tag)
		})
	})
	tags.save()
});

Cloud.afterSave("Story", function(request, response) {
	var story=request.object,
		today=new DATE(),
		user=request.user,
		t=user.get("duration")
	Model.create('post',{id:story.get("post")}).fetch()
		.then(function(post){
			new User({id:post.get("author")}).fetch().then(function(author){
				author.increment("score",3)
				author.save()
			})
			
			//tag beat
			var tags=Tag.collection()
			_.each(post.get('tags'),function(id){
				new Tag({id:id}).fetch().then(function(tag){
					tag.increment("stories",1)
					tag.set("dayBeat",today.dayInc(t,tag.get("dayBeat")))
					tag.set("weekBeat",today.weekInc(t,tag.get("weekBeat")))
					tag.set("monthBeat",today.monthInc(t,tag.get("monthBeat")))
					tag.set("yearBeat",today.yearInc(t,tag.get("yearBeat")))
					tag.increment("allBeat",t)
					tags.add(tag)
				})
			})
			tags.save()
			
			post.increment("stories",1)
			post.save()
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