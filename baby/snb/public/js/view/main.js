define(['view/base','app','tool/offline'],function(View, app,offline){
	var ListPage=View.ListPage, User=Parse.User, 
		Task=app.Task, Favorite=app.Favorite, Post=app.Post
	return new (ListPage.extend({
		title:text('super daddy'),
		cmds:'<a><span class="icon suggest"/></a>\
			<a><span class="icon search"/></a>\
			<a href="#create"><span class="icon plus"/>\
			<a href="#sync"><span class="icon sync"/><span class="tag count"/></a>',
		events:_.extend({},ListPage.prototype.events,{
			'click footer span.suggest': 'suggest',
			'click footer span.search':'showSearchWidget'
		}),
		show:function(query){
			if(query==undefined)
				query= Task.all.length ? "tasks" :"posts"
			if(this[query])
				this[query]()
			else
				this.tags(query)
			ListPage.prototype.show.apply(this,arguments)
		},
		showSearchWidget: function(){
			
		},
		suggest:function(){
		},
		favorites:function(){
			this.itemTemplate=_.template('#tmplPostRef')
			this.collection.reset(Favorite.all)
		},
		posts:function(){
			this.itemTemplate=_.template('#tmplPosts')
			this.setQuery(new Parse.Query(Post))
		},
		mine:function(){
			this.itemTemplate=_.template('#tmplPosts')
			this.setQuery(new Parse.Query(Post).equalTo('author',User.currentUser().id))
		},
		tags:function(tags){
			this.itemTemplate=_.template('#tmplPosts')
			this.setQuery(new Parse.Query(Post).containsAll('tags',tags.split(',')))
		},
		tasks:function(){
			this.itemTemplate=_.template('#tmplPostRef')
			this.collection.reset(Task.all)
		}
	},{})) 
})