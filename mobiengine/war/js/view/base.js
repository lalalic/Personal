define(['app',"jQuery","Promise"],function(app, $, Promise){
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
	
	$(document).ajaxSend(function(){
		var a=$('section.show span.refresh').parent().addClass('doing')
		$(document).one('ajaxComplete',function(){
			a.removeClass('doing')
		})
	}).ajaxError(function(event, jqXHR, ajaxSettings, statusText){
		alert(jqXHR.responseText)
	})
	
	Backbone.View.prototype._class=function(){
		return this.__proto__.constructor
	}
	var User=app.User,
		currentPage={section:null,aside:null},
		Page=Backbone.View.extend({
			tagName:'section',
			title:app.title,
			navs:'<a><span class="icon left-sign back"/></a>\
				<a href="#"><span class="icon home"/></a>\
				<a class="on-right"><span class="icon user"/></a>\
				<a class="on-right"><span class="icon refresh"/></a>',
			content:'Loading...',
			cmds:'',
			template:_.template('<header><h1 class="title centered">{{title}}</h1><nav>{{navs}}</nav></header>\
				<article class="active scroll">{{content}}</article>\
				<footer><nav>{{cmds}}</nav></footer>'),
			events:{'click header .refresh': 'refresh',
				'click header .back':'back', 
				'click header .user':'user',
				'click .signout': 'signout'},
			initialize: function(){
				this.$el.data('transition','slide')
				this.render()
			},
			render: function(){
				$(document.body).append(this.$el.html(this.template(this)))
				!this.cmds && this.$('footer').hide()
				!this.navs && this.$('header').hide()
				return this
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
				currentPage[this.tagName] && currentPage[this.tagName].close()
				this.$el.appendTo('body').addClass('show')
					.one('webkitAnimationEnd animationend',function(){
						$(this).data('direction','')
					}).data('direction','in')
					
				currentPage[this.tagName]=this
				if(User.current())
					this.$el.find('header .user').addClass('signout')
				this.$el.find('header .home,header .back')[(location.hash==''||location.hash=='#') ? 'hide' : 'show']()
				return this
			},
			close: function(){
				this.clear()
				this.$el.removeClass('show')
				this.$el.detach()
				return this
			},
			hide: function(){
				return this.close()
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
					$menu=page.$(menuSelector||'header .user').parent()
					if($menu.length==0)
						return;
					if(app.isLoggedIn()){
						$menu.hide().before(this.$menuHolder)
						this.onAttached && this.onAttached()
					}else{
						$menu.show()
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
					this.$menuHolder=$(document.createElement('a')).addClass('on-right')
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
				this.$list=this.$('ul.list:eq(0)')
				if(_.isString(this.itemTemplate))
					this.itemTemplate=_.template(this.itemTemplate)
				this.collection.on('reset',this.renderAllItems, this)
				this.collection.on('add', this.addOne, this)
				this.collection.on('remove', this.removeOne, this)
				this.collection.on('change', this.changeOne, this)
				this.refresh()
			},
			renderAllItems:function(){
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
			setQuery: function(q){//deprecated for parse
				if(_.isEqual(this.collection.query,q)){
					this.$list.children().show()
					return this
				}
				this.collection.query=q;
				this.refresh()
				return this
			}
		}),
		FormPage=Page.extend({
			content:'<form/>',
			events:_.extend({},Page.prototype.events,{
				'change form *[name]':'change',
				'submit form':'__submit'
			}),
			initialize:function(){
				Page.prototype.initialize.apply(this,arguments)
				this.$('form').attr('id',this.cid+'form')
				this.$('button[type=submit]').attr('form',this.cid+'form')
				this.setModel(this.model)
			},
			change: function(e){
				var el=e.target
				this.model.set(el.name,el.value)
				return this
			},
			__submit: function(){
				this.save()
				return false
			},
			save: function(){
				var isUpdate=!this.model.isNew()
				this.model.save()
				.then(_.bind(function(m){
					this[isUpdate?'onChanged':'onAdded'](m)
				},this))
				return this
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
			setModel: function(model){
				if(this.model==model)
					return this
				this.clear()
				this.model=model
				model && this.$('form *[name]').each(function(){
					model.has(this.name) &&
						$(this).val(model.get(this.name))
				})
				return this
			},
			setDefault: function(){
				return this
			}
		}),
		Popup=Backbone.View.extend({
			container:$('<div class="window confirm show"/>').appendTo($('<div class="notification show"></div>')),
			initialize:function(){
				Backbone.View.prototype.initialize.apply(this,arguments)
				return this.render()
			},
			render:function(){
				this.template && this.$el.append(this.template(this))
				this.content && this.$el.append(this.content)
				return this
			},
			show: function(){
				this.container.append(this.el)
					.parent().appendTo('body')
				return this
			},
			close: function(){
				this.$el.detach()
				this.container.parent().detach()
			}
		}),
		Prompt=new (Popup.extend({
			events:{
				'click button.ok':'onOK',
				'click button.cancel':'onCancel'
			},
			content:'<h6>title here</h6><div class="form"><input type="text"></div><div><button class="ok">OK</button><button class="cancel">Cancel</button></div>',
			show:function(title,value){
				Popup.prototype.show.apply(this,arguments)
				title && this.$('h6').html(title)
				value && this.$('input').val(value)
				return (this.value=new Promise())
			},
			onOK:function(){
				this.value.resolve(this.$('input').val())
				this.reset()
			},
			onCancel:function(){
				this.value.reject()
				this.reset()
			},
			reset:function(){
				this.$('h6').html('')
				this.$('input').val('')
				this.close()
			}
		}))
	window.prompt=function(title,defaultValue){
		return Prompt.show(title)
	}
	
	return {Page:Page,FormPage:FormPage,ListPage:ListPage,Popup:Popup}
})