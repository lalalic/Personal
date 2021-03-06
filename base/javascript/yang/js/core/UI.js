/**
 * base UI classes
 * @module UI
 * @requires app
 * @requires jQuery
 */
define(['app'],function(app){
	$(document).ajaxSend(function(){
		var a=$('section.show span.refresh').parent().addClass('doing')
		$(document).one('ajaxComplete',function(){
			a.removeClass('doing')
		})
	}).ajaxError(function(event, jqXHR, ajaxSettings, statusText){
		alert(jqXHR.responseText||statusText)
	})
	
	Backbone.View.extend=$.aop(Backbone.View.extend,function(_extend){
		return function(properties,classProperties){
			var aView=_extend.apply(this,arguments)
			aView.STYLE && $('head').append("<style>"+aView.STYLE+"</style>") && (delete aView.STYLE)
			aView.TEMPLATE && $('body').append(aView.TEMPLATE) && (delete aView.TEMPLATE)
			return aView
		}
	})		
	var tmplPage='<header><h1 class="title centered">{{title}}</h1><nav>{{navs}}</nav></header>\
				<article class="active scroll">{{content}}</article>\
				<footer><nav>{{cmds}}</nav></footer>'
	var currentPage={section:null,aside:null},
		/**
		 * initialize->render->template, close/hide->clear->detach el
		 * @class Page
		 * @memberof module:UI
		 * @augments Backbone.View
		 */
		Page=Backbone.View.extend(/** @lends module:UI.Page.prototype*/{
			tagName:'section',
			/**Page Title*/
			title:'',
			/**html navigation buttons in header*/
			navs:'<a><span class="icon left-sign back"/></a>\
				<a href="#"><span class="icon home"/></a>\
				<a class="on-right"><span class="icon user"/></a>\
				<a class="on-right"><span class="icon refresh"/></a>',
			/** html content in body*/
			content:'',
			/** html commands buttons in footer*/
			cmds:'',
			/** template function to render page */
			template:_.template(tmplPage),
			events:{'click header .refresh': 'refresh',
				'click header .back':'back', 
				'click header .user':'user',
				'click .signout': 'signout'},
			initialize: function(){
				this.$el.data('transition','slide')
				if(_.isString(this.template))
					this.template=_.template(this.template)
				this.render()
			},
			render: function(){
				$(document.body).append(this.$el.html(this.template(this)))
				!this.cmds && this.$('footer').hide()
				!this.navs && this.$('header').hide()
				return this
			},
			/**refresh page*/
			refresh: function(){
				return this
			},
			/**set title*/
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
				app.isLoggedIn() &&	this.$el.find('header .user').addClass('signout')
				this.$el.find('header .home,header .back')[(location.hash==''||location.hash=='#') ? 'hide' : 'show']()
				return this
			},
			close: function(){
				this.hide()
				this.remove()
			},
			hide: function(){
				this.$el.removeClass('show')
				this.$el.detach()
				return this
			},
			/**clear content when close page*/
			clear: function(){
				return this
			},
			/**go back page*/
			back: function(){
				history.go(-1)
			},
			/**reload page*/
			reload: function(){
				location.reload()
				return this
			},
			user: function(){
				if(!app.isLoggedIn()){
					require(['view/user'],function(user){
						new user().show('signin')
					})
				}
			},
			signout: function(){
				app.logout()
				this.reload()
				return false
			},
			/**
			 * popup a container
			 * @param {DOMElement} container
			 */
			popup:function(el,e){
				el.show()
				e.stopPropagation()
				$(document).one('click',function(e){
					el.hide()
				})
			},
			/**
			 *  protected function to check if empty content should be shown
			 */
			_isEmpty: function(){
				return this.$('article').is(':empty')
			},
			/**
			 *  internal called by router just after every show
			 */
			_emptivible: function(){
				if(this._isEmpty()){
					if(this.$('article>.empty').length==0)
						this.$('article').append(_.template('#tmplEmpty',this.EMPTY))
				}else
					this.$('article>.empty').remove()
			},
			/**
			 *  empty content parameters
			 */
			EMPTY:/** @lends module:UI.Page.prototype.EMPTY*/{
				/**
				 *  ICON type
				 */
				type:'user',
				/**
				 *  title for empty content
				 */
				title:'NO CONTENT',
				/**
				 *  description for empty content
				 */
				description:'',
				/**
				 *  actions/buttons/links for shortcut
				 */
				action:''
			}
		},/** @lends module:UI.Page*/{
			/**css styles used by this UI class*/
			STYLE: "body,section,aside{overflow:hidden}\
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
					.tags:before{content:'\ue61a';font-family:'lungojsicon';font-weight:normal!important}\
					.tag:empty{visibility:hidden!important}\
					.popup.shortcut{top:45px; height:1px;}\
					.popup.shortcut li{background-color:#00afe3}\
					.primary{background-color:red!important}",
			/**convert this Page class to Aside Page class */
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
			/**convert this page class to Shortcut Page class*/
			asShortcut: function(menuSelector){
				this.prototype.tagName='div'
				this.prototype.className="hidden popup shortcut "+(this.prototype.className||"")
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
		/**
		 * @class ListPage
		 * @memberof module:UI
		 * @augments module:UI.Page
		 */
		ListPage=Page.extend(/** @lends module:UI.ListPage.prototype*/{
			content:'<ul class="list"/>',
			/**templat function to render for an item*/
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
				this.collection.on('sync', this._emptivible, this)
			},
			renderAllItems:function(){
				this.$list.empty()
				this.collection.each(this.addOne,this)
				return this
			},
			addOne: function(item){
				this.itemTemplate && this.$list.append(this.itemTemplate(item)) 
				return this
			},
			removeOne: function(item){
				this.$list.find('#_'+item.id).remove()
				return this
			},
			changeOne: function(item){
				this.itemTemplate && this.$list.find('#_'+item.id).replaceWith(this.itemTemplate(item))
				return this
			},
			show: function(){
				Page.prototype.show.apply(this,arguments)
				if(this.collection && this.collection.length>0)
					return this.renderAllItems()
				else
					return this.refresh()
			},
			refresh: function(){
				this.collection && this.collection.fetch()
				return this
			},
			_isEmpty: function(){
				return this.$list.is(':empty')
			},
			_emptivible: function(){
				if(arguments.length)
					return Page.prototype._emptivible.apply(this,arguments)
			}
		}),
		/**
		 * 
		 * @class FormPage
		 * @memberof module:UI
		 * @augments module:UI.Page
		 */
		FormPage=Page.extend(/**@lends module:UI.FormPage*/{
			content:'<form/>',
			events:_.extend({},Page.prototype.events,{
				'change form *[name]':'change',
				'submit form':'__submit'
			}),
			initialize:function(){
				Page.prototype.initialize.apply(this,arguments)
				this.$('form').attr('id',this.cid+'form')
				this.$('button[type=submit]').attr('form',this.cid+'form')
				this.model && this.setModel(this.model)
			},
			/**
			 * handler for change on *[name] 
			 */
			change: function(e){
				var el=e.target
				this.model.set(el.name,el.value,{validate:true, silent: true})
				return this
			},
			__submit: function(){
				this.save()
				return false
			},
			save: function(){
				if(!this.model.hasChanged())
					return this
				var isUpdate=!this.model.isNew()
				this.model.save(this.model.changedAttributes(), {patch:true,wait:true})
				.then(_.bind(function(){
					this[isUpdate?'onChanged':'onAdded'](this.model)
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
			/**
			 * change model and then show values
			 */
			setModel: function(model){
				if(this.model==model)
					return this
				this.clear()
				this.model=model
				model && this.$('form :input[name]').filter(':not(:checkbox,:radio)').each(function(){
					if(model.has(this.name)){
						$(this).val(model.get(this.name)||'')
						this.name==model.idAttribute&& $(this).attr('readonly',model.id&&true)
					}
				})
				return this
			},
			/**
			 * set default value on input 
			 */
			setDefault: function(){
				return this
			},
			_isEmpty:function(){return false}
		}),
		/**
		 * @class Popup
		 * @memberof module:UI
		 * @augments Backbone.View
		 */
		Popup=Backbone.View.extend(/**@lends module:UI.Popup.prototype*/{
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
		/**
		 * @class Prompt
		 * @memberof module:UI
		 * @augments module:UI.Popup
		 */
		Prompt=new (Popup.extend(/**@lends module:UI.Prompt.prototype*/{
			events:{
				'click button.ok':'onOK',
				'click button.cancel':'onCancel'
			},
			content:'<h6>title here</h6><div class="form"><input type="text"></div><div><button class="ok">OK</button><button class="cancel">Cancel</button></div>',
			show:function(title,value){
				Popup.prototype.show.apply(this,arguments)
				title && this.$('h6').html(title)
				value && this.$('input').val(value)
				return (this.value=new $.Deferred)
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
		})),
		Alert=new (Popup.extend(/** @lends module:UI.Alert.prototype*/{
			events:{
				'click button.ok':'close'
			},
			content:'<h6>Alert</h6><p/><center><button class="ok">OK</button></center>',
			show:function(value){
				Popup.prototype.show.apply(this,arguments)
				this.$('p').text(value||'')
				return this
			}
		}))
	/**
	 * override default prompt
	 * @global
	 * @function
	 * @returns {Promise}
	 */
	window.prompt=function(title,defaultValue){
		return Prompt.show(title)
	}
	
	/**
	 *  override default alert
	 *  @global
	 *  @function
	 */
	 window.alert=function(message){
		Alert.show(message)
	 }
	
	return {
		Page:Page,
		FormPage:FormPage,
		ListPage:ListPage,
		Popup:Popup,
		FileLoader:'<span class="icon load" onclick="$(this).next().click()"/><input type="file" class="outview">',
		util:{
			save:function(data, name, type){
				var a=document.createElement("a")
				document.body.appendChild(a)
				a.href=_.isString(data ) ? ('data:'+(type||'text/plain')+';base64,'+data) : 
					URL.createObjectURL(data.generate({type:'blob'}))
				a.download=name||"document"
				a.click()
				document.body.removeChild(a)
			}
		}
	}
})