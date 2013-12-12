define(['view/base','app','tool/offline'],function(View, app,offline){
	var ListPage=View.ListPage, Task=app.Task
	return new (ListPage.extend({
		title:text('My Tasks'),
		cmds:'<a href="#plan" class="primary"><span class="icon magnet plan"/></a>\
			<a href="#categories"><span class="icon search"/></a>\
			<a href="#favorites"><span class="icon star"/></a>\
			<a href="#sync"><span class="icon upload"/><span class="tag count"/></a>',
		itemTemplate:'#tmplPostRef',
		events:_.extend({},ListPage.prototype.events,{
			'click footer span.plan': 'autoplan'
		}),
		collection: Task.all,
		initialize: function(){
			ListPage.prototype.initialize.apply(this,arguments)
			this.$sync=this.$el.find('footer span.upload').parent()
			this.collection.trigger('reset')
		},
		show: function(){
			var pendings=offline.needSync()
			if(pendings)
				this.$sync.show().find('.count').text(pendings)				
			else
				this.$sync.hide();
			return ListPage.prototype.show.apply(this,arguments)
		},
		autoplan: function(){
			
		}
	}))
})