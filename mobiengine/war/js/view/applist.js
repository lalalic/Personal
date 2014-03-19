define(['UI','app'],function(View,app){
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
			this.collection.on('current',this.changeCurrent,this)
			this.collection.trigger('reset')
			$('body').append('<style>\
				.applist.popup{top:45px;height:1px;}\
				.appplist.popup li{background-color:#00afe3}\
				</style>')
			return this
		},
		render: function(){
			ListPage.prototype.render.apply(this,arguments)
			$('<ul class="list extra">').appendTo(this.$('article'))
				.append('<li class="create thumb"><a href="#app"><span class="icon plus"/></a></li>')
				.append('<li class="thumb"><a href="javascript:void"><span class="icon signout"/></a></li>')			
			return this
		},
		onCreate:function(){
			Application.current(null)
		},
		onClickApp:function(e){
			Application.current(Application.all.get(parseInt(this.id.substr(1))))
		},
		changeCurrent:function(m){
			m && this.$('#_'+m.id).addClass('active')
				.siblings('.active').removeClass('active')
			if(this.$menuHolder)
				this.onAttached()
			return this
		},
		addOne: function(item){
			ListPage.prototype.addOne.apply(this,arguments)
			if(this.collection.length==1)
				Application.current(item)
			return this
		},
		removeOne: function(item){
			ListPage.prototype.removeOne.apply(this,arguments)
			var current=Application.current()
			if(current && current.id==item.id){
				if(this.collection.length)
					Application.current(this.collection.models.first())
				else
					Application.current(null)
			}
		},
		changeOne: function(item){
			var li=this.$('#_'+item.id)
			if(item.hasChanged('name'))
				li.find('a').text(item.get('name'))
		},
		onAttached:function(){
			var app=Application.current()
			if(app){
				this.$('.create').show()
				this.$menuHolder.removeAttr('href').empty()
					.html('<span>'+app.get('name')+'</span>')
					.find('span').click(_.bind(this.show,this))
			}else{
				this.$('.create').hide()
				this.$menuHolder.attr('href','#app').empty()
					.html('<span class="icon plus"/>')
					.find('span').click(_.bind(this.show,this))
			}
		}
	}).asMenu())
})