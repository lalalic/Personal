define(['UI','app'],function(UI,app){
	var Child=app.Child
	return new (UI.ListPage.extend({
		itemTemplate:'#tmplChildren',
		cmds:'<a href="#child"><span class="icon plus"/></a>',
		collection: Child.all,
		initialize:function(){
			this._super().initialize.apply(this,arguments)
			this.$('header').remove()
			this.$('article').removeClass('scroll')
			this.collection.on('current',this.showCurrent, this)
			this.collection.trigger('reset')
		},
		clear: function(){
			return this
		},
		render: function(){
			this._super().render.apply(this,arguments)
			return this.showCurrent(Child.current())
		},
		showCurrent: function(m){
			Child.current() && this.$('li').removeClass('active')
				.filter('#_'+Child.current().id).addClass('active')
			return this
		},
		addOne: function(item){
			this._super().addOne.apply(this,arguments)
			if(this.collection.length==1)
				Child.current(item)
			return this
		},
		removeOne: function(item){
			this._super().removeOne.apply(this,arguments)
			if(Child.current().id==item.id)
				Child.current(this.collection.first())
		},
		changeOne: function(item){
			var li=this.$('#_'+item.id)
			if(item.hasChanged('name'))
				li.find('a').text(item.get('name'))
			if(item.hasChanged('photo'))
				li.find('img').attr('src',item.getUrl('photo'))
		}
	}).asMenu())
})