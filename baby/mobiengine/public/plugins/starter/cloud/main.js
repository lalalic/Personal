var Trace=Model.extend({className:'Trace'})
function setAuthor(request){
	if(request.object.isNew()){
		var o=request.object
		o.set("author",request.user.id)
		o.set("authorName",request.user.get("username"))
	}
}

_.each(["Post",'Child'],function(f){
	Cloud.beforeSave(f, function(request, response) {
		console.debug("befoe save a "+f)
		setAuthor(request)
	})
	
	Cloud.afterSave(f, function(request,response){
		console.debug("after save a "+f)
		var t=new Trace({message:f+" created"})
		console.debug(JSON.stringify(t))
		t.save()
		console.debug("saved "+t)
	})
})