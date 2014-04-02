define(['UI','app'],function(UI,app){
	var Child=app.Child
	return new (UI.ListPage.extend({
		className: 'children',
		itemTemplate:'#tmplChildren',
		collection: Child.all,
		initialize:function(){
			this._super().initialize.apply(this,arguments)
			this.collection.on('current',this.showCurrent, this)
			this.collection.trigger('reset')
			return this
		},
		refresh: function(){return this},
		render: function(){
			this._super().render.apply(this,arguments)
			$('<ul class="list extra">').appendTo(this.$('article'))
				.append('<li class="create thumb"><a href="#child"><span class="icon plus"/></a></li>')
				.append('<li class="thumb"><a href="javascript:void"><span class="icon signout"/></a></li>')			
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
		},
		onAttached:function(){
			var child=Child.current()
			if(child){
				this.$('.create').show()
				this.$menuHolder.removeAttr('href').empty()
					.html('<span>'+child.get('name')+'</span>')
					.find('span').click(_.bind(this.show,this))
			}else{
				this.$('.create').hide()
				this.$menuHolder.attr('href','#child').empty()
					.html('<span class="icon plus"/>')
					.find('span').click(_.bind(this.show,this))
			}
		}
	}).asMenu())
})