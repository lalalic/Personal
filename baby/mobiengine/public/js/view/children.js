define(['UI','app'],function(UI,app){
	var Child=app.Child
	return new (UI.ListPage.extend({
		itemTemplate:'#tmplChildren',
		cmds:'<a href="#child"><span class="icon plus"/></a>',
		collection: Child.all,
		initialize:function(){
			ListPage.prototype.initialize.apply(this,arguments)
			this.$('header').remove()
			this.$('article').removeClass('scroll')
			this.collection.on('current',this.changeCurrent, this)
			this.collection.trigger('reset')
		},
		clear: function(){
			return this
		},
		render: function(){
			ListPage.prototype.render.apply(this,arguments)
			return this.changeCurrent(Child.current)
		},
		changeCurrent: function(m){
			Child.current=m
			if(!m){
				localStorage.setItem('childCurrent',null)
				return 
			}				
			localStorage.setItem('childCurrent',m.id)
			this.$('li').removeClass('active')
				.filter('#_'+Child.current.id).addClass('active')
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
					this.changeCurrent(null)
			}
		},
		changeOne: function(item){
			var li=this.$('#_'+item.id)
			if(item.hasChanged('name'))
				li.find('a').text(item.get('name'))
			if(item.hasChanged('photo'))
				li.find('img').attr('src',item.getUrl('photo'))
		},
		isCurrent: function(m){
			return m.id==localStorage.getItem('childCurrent')
		}
	}).asMenu())
})