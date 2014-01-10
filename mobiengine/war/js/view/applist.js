define(['view/base','app'],function(View,app){
	var ListPage=View.ListPage,Application=app.Application
	return new (ListPage.extend({
		className:'applist',
		collection: Application.all,
		itemTemplate:'#tmplApps',
		events:{
			'click .applist .app': 'onClickApp',
			'click ul.extra .create>a':'onCreate'},
		initialize: function(){
			ListPage.prototype.initialize.apply(this,arguments)
			this.collection.trigger('reset')
			$('body').append('<style>\
				.applist.popup{top:45px;height:1px;}\
				.appplist.popup li{background-color:#00afe3}\
				</style>')
			return this
		},
		render: function(){
			$('<ul class="list extra">').appendTo(this.$('article'))
				.append('<li class="create thumb"><a href="#app"><span class="icon plus"/></a></li>')
				.append('<li class="thumb"><a href="javascript:void"><span class="icon signout"/></a></li>')			
			return ListPage.prototype.render.apply(this,arguments)
		},
		onCreate:function(){
			Application.current(null)
		},
		onClickApp:function(e){
			this.changeCurrent(Application.all.get(parseInt($(this).data('id'))))
		},
		changeCurrent:function(m){
			var current=Application.current(m)
			var apps=this.$('li').removeClass('active')
			current && apps.filter('#_'+current.id).addClass('active')
			if(this.$menuHolder)
				this.onAttached()
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
			if(Application.current.id==item.id){
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
		},
		isCurrent: function(m){
			return (m.id+"")==localStorage.getItem('appCurrent')
		},
		onAttached:function(){
			switch(this.collection.length){
			case 0:
				this.$('.create').hide()
				this.$menuHolder.attr('href','#app')
					.html('<span class="icon plus"/>')
				break;
			default:
				var current=Application.current()
				this.$('.create').show()
				this.$menuHolder.removeAttr('href')
					.html('<span>'+(current && current.get('name') || '...')+'</span>')
					.find('span').click(_.bind(this.show,this))
			}
		}
	}).asMenu())
})