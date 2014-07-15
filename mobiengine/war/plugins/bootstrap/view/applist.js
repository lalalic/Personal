define(['UI','app'],function(UI,app){
	var Application=app.Application
	return new (UI.ListPage.extend({
		className:'applist',
		collection: Application.all,
		itemTemplate:_.template('<li><a id="_{{id}}" class="app">{{get("name")}}</a></li>'),
		events:{
			'click .list .app': 'onClickApp',
			'click ul.extra .create':'onCreate'
		},
		initialize: function(){
			this._super().initialize.apply(this,arguments)
			this.collection.on('current',this.changeCurrent,this)
			this.collection.trigger('reset')
			return this
		},
		refresh:function(){return this},
		render: function(){
			this._super().render.apply(this,arguments)
			$('<ul class="list extra">').appendTo(this.$('article'))
				.append('<li class="create thumb"><a href="#settings"><span class="icon plus"/></a></li>')
				.append('<li class="thumb"><a href="javascript:void"><span class="icon signout"/></a></li>')			
			return this
		},
		onCreate:function(){
			Application.current(null)
		},
		onClickApp:function(e){
			Application.current(Application.all.get(e.target.id.substr(1)))
		},
		changeCurrent:function(m){
			m && this.$('#_'+m.id).addClass('active')
				.siblings('.active').removeClass('active')
			if(this.$menuHolder)
				this.onAttached()
			return this
		},
		addOne: function(item){
			this._super().addOne.apply(this,arguments)
			if(this.collection.length==1)
				Application.current(item)
			return this
		},
		removeOne: function(item){
			this._super().removeOne.apply(this,arguments)
			var current=Application.current()
			if(current && current.id==item.id){
				if(this.collection.length)
					Application.current(this.collection.models.first())
				else
					Application.current(null)
			}
		},
		onAttached:function(){
			var app=Application.current()
			if(app){
				this.$('.create').show()
				this.$menuHolder.removeAttr('href').empty()
					.html('<span>'+app.get("name")+'</span>')
					.find('span').click(_.bind(this.show,this))
			}else{
				this.$('.create').hide()
				this.$menuHolder.attr('href','#settings').empty()
					.html('<span class="icon plus"/>')
					.find('span').click(_.bind(this.show,this))
			}
			this.delegateEvents()
		}
	}).asShortcut())
})