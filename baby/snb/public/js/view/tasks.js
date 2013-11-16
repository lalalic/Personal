define(['view/base','app'],function(View, app){
	var ListPage=View.ListPage, Task=app.Task
	return new (ListPage.extend({
		title:'My Tasks',
		itemTemplate:'#tmplPostRef',
		collection: Task.all,
		initialize: function(){
			ListPage.prototype.initialize.apply(this,arguments)
			this.collection.trigger('reset')
		}
	}))
})