define(['view/base','app','tool/offline'],function(View, app,offline){
	var ListPage=View.ListPage, Task=app.Task
	return new (ListPage.extend({
		title:text('super daddy'),
		cmds:'<a><span class="icon suggest"/></a>\
			<a><span class="icon search"/></a>\
			<a href="#create"><span class="icon plus"/>\
			<a href="#sync"><span class="icon upload"/><span class="tag count"/></a>',
		events:_.extend({},ListPage.prototype.events,{
			'click footer span.suggest': 'suggest',
			'click footer span.search':'showSearchWidget'
		}),
		show:function(query){
			if(query==undefined){
				if(Task.all.length)
					this.collection.reset(Task.all)
				else
					this.setQuery(new Parse.Query(app.Post))
			}else if(this[query])
				this[query]()
			else
				this.tags(query)
		},
		showSearchWidget: function(){},
		suggest:function(){},
		favorites:function(){},
		mine:function(){},
		tags:function(){
		}
	},{})) 
})