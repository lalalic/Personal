define(['view/base','app'],function(View,app){
	var ListPage=View.ListPage, Child=app.Child
	var ChildrenAside=ListPage.extend({
		tagName:'aside',
		className:'show box',
		itemTemplate:'#tmplChildren',
		cmds:'<a href="#child"><span class="icon plus"/></a>',
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
	})
	
	var PhoneVersion=ChildrenAside.extend({
		tagName:'div',
		template:_.template('{{content}}'),
		className:'popup hidden children',
		events:false,
		initialize: function(){
			ChildrenAside.prototype.initialize.apply(this,arguments)
			this.$el.removeAttr("data-transition")
			$('body').append('<style>\
				.children.popup{top:45px;height:1px;}\
				.children.popup li{background-color:#00afe3}\
				</style>')
			var _show=View.Page.prototype.show, me=this
			View.Page.prototype.show=function(){
				_show.apply(this,arguments)
				me.attach(this)
				return this
			}
			return this
		},
		show: function(e){
			e.stopPropagation()
			var me=this
			this.$el.appendTo('section.show').show()
			$(document).one('click',_.bind(this.$el.hide,this.$el))
			return this
		},
		render: function(){
			$('<ul class="list extra">').appendTo(this.$el)
				.append('<li class="create thumb"><a href="#child"><span class="icon plus"/></a></li>')
				.append('<li class="thumb"><a href="javascript:void"><span class="icon signout"/></a></li>')			
			return ChildrenAside.prototype.render.apply(this,arguments)
		},
		changeCurrent: function(m){
			ChildrenAside.prototype.changeCurrent.apply(this,arguments)
			if(this.$cmd){
				switch(this.collection.length){
				case 0:
					this.$('.create').hide()
					this.$cmd.attr('href','#child')
						.html('<span class="icon plus"/>')
					break;
				default:
					this.$('.create').show()
					this.$cmd.removeAttr('href')
						.html('<img src="'+m.getUrl('photo')+'">')
						.find('img').click(_.bind(this.show,this))
				}
			}
			return this
		},
		changeOne: function(item){
			ChildrenAside.prototype.changeOne.apply(this,arguments)
			if(this.isCurrent(item) && (item.hasChanged('photo') || item.hasChanged('name')))
				this.changeCurrent(item)
			return this
		},
		attach: function(page){
			if(app.isLoggedIn()){
				var $user=page.$('header .user').parent().hide()
				if(!page._$childrenCmd)
					$user.before(this.$cmd=page._$childrenCmd=$('<a href="#child" class="on-right"></a>'))
				else
					this.$cmd=page._$childrenCmd
			}else{
				page.$('header .user').parent().show()
				if(page._$childrenCmd){
					page._$childrenCmd.remove()
					delete page._$childrenCmd
				}
				this.$cmd=null
			}
			this.changeCurrent(Child.current)
		}
	})
	
	switch($.media){
	case 'phone':
		return new PhoneVersion
	default:
		return new ChildrenAside
	}
})