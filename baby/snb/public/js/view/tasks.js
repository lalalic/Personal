define(['view/base','app','tool/offline'],function(View, app,offline){
	var ListPage=View.ListPage, Task=app.Task
	return new (ListPage.extend({
		title:text('My Tasks'),
		itemTemplate:'#tmplPostRef',
		collection: Task.all,
		initialize: function(){
			ListPage.prototype.initialize.apply(this,arguments)
			this.collection.trigger('reset')
		}
	}))
})