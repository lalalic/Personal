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
		
	Parse.Object.prototype.getUrl=function(a){
		return this.has(a)?this.get(a).url():null
	}
	Date.prototype.ago=function(){
		var delta=parseInt((new Date().getTime()-this.getTime())/1000),
			aday=24*60*60
		if(delta<aday){
			if(delta<60)
				return delta+'秒前'
			else if(delta<60*60)
				return parseInt(delta/60)+'分前'
			else
				return parseInt(delta/60/60)+"小时前"
		}else if (delta<aday*2)
			return '昨天'
		else if (delta<aday*3)
			return '前天'
		else
			return this.getMonth()+1+"-"+this.getDay()+1;
	}
	var _ajax=Parse._ajax
	Parse._ajax=function(){
		var a=$('section.show span.refresh').parent().addClass('doing'),
			p=_ajax.apply(this,arguments), 
			done=function(){a.removeClass('doing')}
		p.then(done,done)
		return p
	}
	$(document).on('ajaxSend',function(){
		var a=$('section.show span.refresh').parent().addClass('doing')
		$(document).one('ajaxComplete',function(){
			a.removeClass('doing')
		})
	})
	var currentPage={section:null,aside:null},
		Page=Parse.View.extend({
			clazz:'Page',
			tagName:'section',
			title:'Loading...',
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
				if(Parse.User.current())
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
				if(!Parse.User.current()){
					require(['view/user'],function(user){
						user.show('signin')
					})
				}
			},
			signout: function(){
				Parse.User.logOut()
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
		}),
		ListPage=Page.extend({
			content:'<ul class="list"/>',
			itemTemplate:false,
			collection: new (Parse.Collection.extend({})),
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
				this.collection.query &&this.collection.fetch()
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
			change: function(e){
				var el=e.srcElement
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
			onAdded: function(m){},
			onChanged: function(m){},
			setDefault: function(){
				return this
			}
		})
	
	return {Page:Page,FormPage:FormPage,ListPage:ListPage}
})