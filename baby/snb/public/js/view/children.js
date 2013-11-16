define(['view/base','app'],function(View,app){
	var ListPage=View.ListPage, Child=app.Child
		
	return new (ListPage.extend({
		clazz:'ChildrenAside',
		tagName:'aside',
		className:'show box',
		itemTemplate:'#tmplChildren',
		cmds:'<a href="#"><span class="icon signout"/></a><a href="#child"><span class="icon plus"/></a>',
		events:_.extend({},ListPage.prototype.events,{
			'click footer span.signout': 'signout'
		}),
		collection: Child.all,
		initialize:function(){
			ListPage.prototype.initialize.apply(this,arguments)
			this.$('header').remove()
			this.$('article').removeClass('scroll')
			this.collection.on('current',this.changeCurrent, this)
			this.collection.trigger('reset')
			Child.current&&this.$('#'+Child.current.id).addClass('active')
		},
		signout: function(){
			Parse.User.logOut()
			app.clear4User()
			Parse.history.navigate('#categories',{replace:true,trigger:true})
			return false
		},
		clear: function(){
			return this
		},
		changeCurrent: function(m){
			localStorage['childCurrent']=m.id
			Child.current=m
			this.$('li').removeClass('active')
				.filter('#'+Child.current.id).addClass('active')
			return this
		},
		addOne: function(item){
			ListPage.prototype.addOne.apply(this,arguments)
			if(this.collection.length==1)
				this.changeCurrent(item)
			return this
		},
		removeOne: function(item){
			ListPage.prototype.removeOne.apply(this,arguments)
			if(Child.current.id==item.id){
				if(this.collection.length)
					this.changeCurrent(this.collection.models[0])
				else
					Child.current=null
			}
		},
		changeOne: function(item){
			var li=this.$('#'+item.id)
			if(item.hasChanged('name'))
				li.find('a').text(item.get('name'))
			if(item.hasChanged('photo'))
				li.find('img').attr('src',item.getUrl('photo'))
		}
	}))
})