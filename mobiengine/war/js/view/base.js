define(['app'],function(app){
	$('body').append("<style>\
		body,section,aside{overflow:hidden}\
		nav img{width:32px;height:32px}\
		.doing{-webkit-animation:rotatingLoader 600ms infinite linear;moz-animation:rotatingLoader 600ms infinite linear}\
		.outview{position:absolute;top:-9999px;height:1px}\
		span.checkable{line-height:35px;}\
		span.checkable>span{padding:5px;cursor:default}\
		span.checkable>span:not(:first-of-type){color:lightgray}\
		span.checkable>span:hover{color:blue}\
		span.checkable input:checked+span{color:black}\
		span.checkable>span:first-of-type{background-color:lightgreen;color:white}\
		span.checkable input{position:absolute;top:-9999px;height:1px}\
		span.checkable input:not(:checked)+span{display:none}\
		span.checkable.open input:not(:checked)+span{display:initial}\
		span.checkable:not(.open)>span:first-of-type:after{content:'...'}\
		span.checkable.vertical>span{display:block!important}\
		.tags{text-align:center}\
		.tags:before{content:'\f02b';font-family:'lungojsicon';font-weight:normal!important}\
		.tag:empty{visibility:hidden!important}\
		.primary{background-color:red!important}\
		</style>")
		
	$(document).on('ajaxSend',function(){
		var a=$('section.show span.refresh').parent().addClass('doing')
		$(document).one('ajaxComplete',function(){
			a.removeClass('doing')
		})
	})
	var User=app.User
	var currentPage={section:null,aside:null}
		Page=Backbone.View.extend({
			clazz:'Page',
			tagName:'section',
			title:app.title,
			navs:'<a><span class="icon left-sign back"/></a>\
				<a href="#"><span class="icon home"/></a>\
				<a class="on-right"><span class="icon user"/></a>\
				<a class="on-right"><span class="icon refresh"/></a>',
			content:'Loading...',
			cmds:'',
			template:_.template('<header><h1 class="title centered">{{title}}</h1><nav>{{navs}}</nav></header><article class="active scroll">{{content}}</article><footer><nav>{{cmds}}</nav></footer>'),
			events:{'click header .refresh': 'refresh',
				'click header .back':'back', 
				'click header .user':'user',
				'click .signout': 'signout'},
			initialize: function(){
				this.$el.data('transition','slide')
				$(document.body).append(this.$el.html(this.template(this)))
				if(!this.cmds)
					this.$('footer').hide()
				if(!this.navs)
					this.$('header').hide()
			},
			loading: function(a){
				this.$('span.refresh').parent()[a===false?'removeClass':'addClass']('doing')
			},
			refresh: function(){
				return this
			},
			setTitle:function(t){
				this.$('header h1').html(t).text()
				return this
			},
			show: function(){
				if(currentPage[this.tagName]==this)
					return this
				currentPage[this.tagName] && currentPage[this.tagName].hide()
				this.$el.addClass('show')
					.one('webkitAnimationEnd animationend',function(){
						$(this).data('direction','')
					}).data('direction','in')
					
				currentPage[this.tagName]=this
				if(User.current())
					this.$el.find('header .user').addClass('signout')
				this.$el.find('header .home,header .back')[(location.hash==''||location.hash=='#') ? 'hide' : 'show']()
				return this
			},
			hide: function(){
				this.clear()
				this.$el.removeClass('show')
				return this
			},
			clear: function(){
				return this
			},
			back: function(){
				history.go(-1)
			},
			reload: function(){
				location.reload()
				return this
			}, 
			user: function(){
				if(!User.current()){
					require(['view/user'],function(user){
						user.show('signin')
					})
				}
			},
			signout: function(){
				User.logOut()
				app.clear4User()
				this.reload()
				return false
			},
			popup:function(el,e){
				el.show()
				e.stopPropagation()
				$(document).one('click',function(e){
					el.hide()
				})
			}
		},{
			asAside:function(){
				this.prototype.tagName='aside'
				this.prototype.className='show box'
				this.prototype.navs=''
				var _init=this.prototype.initialize
				this.prototype.initialize=function(){
					_init.apply(this,arguments)
					this.$('article').removeClass('scroll')
				}
				return this
			},
			asMenu: function(menuSelector){
				this.prototype.tagName='div'
				this.prototype.className+=" hidden popup"
				this.prototype.attach=function(page){
					$menu=$(menuSelector||'header .user').parent()
					if($menu.length==0)
						return;
					if(app.isLoggedIn()){
						$menu.hide()
						if(!page._$menuHolder)
							$menu.before(this.$menuHolder=page._$menuHolder=$('<a class="on-right"></a>'))
						else
							this.$menuHolder=page._$menuHolder
						this.onAttached && this.onAttached()
					}else{
						$menu.show()
						if(page._$menuHolder){
							page._$menuHolder.remove()
							delete page._$menuHolder
						}
						this.$menuHolder=null
					}
				}
				var _init=this.prototype.initialize
				this.prototype.initialize=function(){
					var me=this,
						_show=Page.prototype.show
					Page.prototype.show=function(){
						_show.apply(this,arguments)
						me.attach(this)
						return this
					}
					_init.apply(this,arguments)
					this.$('header,footer').remove()
					this.$('article').removeClass('scroll')
					this.$el.removeAttr("data-transition")
					return this
				}
				this.prototype.show=function(e){
					return this.popup(this.$el.appendTo('section.show'),e)
				}
				return this
			}
		}),
		ListPage=Page.extend({
			content:'<ul class="list"/>',
			itemTemplate:false,
			initialize: function(){
				Page.prototype.initialize.apply(this,arguments)
				this.$list=this.$('ul.list')
				if(_.isString(this.itemTemplate))
					this.itemTemplate=_.template(this.itemTemplate)
				this.collection.on('reset',this.render, this)
				this.collection.on('add', this.addOne, this)
				this.collection.on('remove', this.removeOne, this)
				this.collection.on('change', this.changeOne, this)
				this.refresh()
			},
			render:function(){
				this.$list.empty()
				this.collection.each(this.addOne,this)
				return this
			},
			addOne: function(item){
				this.$list.append(this.itemTemplate(item)) 
				return this
			},
			removeOne: function(item){
				this.$list.find('#_'+item.id).remove()
				return this
			},
			changeOne: function(item){
				this.$list.find('#_'+item.id).replaceWith(this.itemTemplate(item))
				return this
			},
			refresh: function(){
				this.collection && this.collection.fetch()
				return this
			},
			setQuery: function(q){
				if(_.isEqual(this.collection.query,q)){
					this.$list.children().show()
					return this
				}
				this.collection.query=q;
				this.refresh()
				return this
			},
			clear: function(){
				this.$list.children().hide()
				return Page.prototype.clear.apply(this,arguments)
			}
		}),
		FormPage=Page.extend({
			content:'<form/>',
			events:_.extend({},Page.prototype.events,{
				'change form *[name]':'change',
				'submit form':'save'
			}),
			initialize:function(){
				Page.prototype.initialize.apply(this,arguments)
				this.$('form').attr('id',this.cid+'form')
				this.$('button[type=submit]').attr('form',this.cid+'form')
			},
			show: function(){
				Page.prototype.show.apply(this,arguments)
				this.render()
				return this
			},
			change: function(e){
				var el=e.target
				this.model.set(el.name,el.value)
				return this
			},
			save: function(){
				var isUpdate=this.model.id, me=this
				this.model.save()
					.then(function(m){
						me[isUpdate?'onChanged':'onAdded'](m)
					})
				return false
			},
			clear: function(){
				this.$('form').get(0).reset()
				delete this.model
				Page.prototype.clear.apply(this,arguments)
				this.setDefault();
				return this
			},
			onAdded: function(m){
				if(this.collection)
					this.collection.add(m)
			},
			onChanged: function(m){
				m.trigger('change',m)
			},
			setDefault: function(){
				return this
			}
		})
	
	return {Page:Page,FormPage:FormPage,ListPage:ListPage}
})