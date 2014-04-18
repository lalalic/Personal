var aa
function error(e){console.warn(e)}
function isNewCreated(o){return o.get('createdAt').getTime()==o.get('updatedAt').getTime()}

_.each(["Comment","Story","Post","Favorite",'Child',"Task"],function(f){
	Cloud.beforeSave(f, function(request, response) {
		if(!request.object.isNew()) return
		var o=request.object,user=request.user
		o.set("author",user.id)
		o.set("authorName",user.get("username"))
	})
})

Cloud.afterSave("Comment", function(request, response) {
	var user=request.user,
		post=Model.create('Post',{id:request.object.get("post")});
	post.fetch().then(function(){
		post.increment("comments",1)
		post.save().then(null,error)
	},error)
	
	user.increment("score",1)
	user.increment("comments",1)
	user.save().then(null,error)
});

Cloud.afterSave("Post", function(request, response) {
	var post=request.object
		user=request.user
	if(!isNewCreated(post))
		return
	user.increment("post",1)
	user.increment("score",10)
	user.save().then(null,error)

	//tag count;category, duration, goal, gender, and etc
	_.each(post.get('tags'),function(id){
		var tag=Model.create('Tag',{id:id})
		tag.fetch().then(function(){
			tag.increment('posts',1)
			(aa=post.get('duration')) && tag.increment('time', aa)
			tag.save()
		})
	})
});