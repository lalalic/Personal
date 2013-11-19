define(['app'],function(app){
	Parse.Object.prototype.getUrl=function(a){
		return this.has(a)?this.get(a).url():null
	}
	Parse.Object.prototype.ago=function(){
		var delta=parseInt((new Date().getTime()-this.createdAt.getTime())/1000),
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
			return this.createdAt.getMonth()+1+"-"+this.createdAt.getDay()+1;
	}
	var _ajax=Parse._ajax
	Parse._ajax=function(){
		var a=$('section.show span.refresh').parent().addClass('doing')
		var p=_ajax.apply(this,arguments)
		p.then(function(){
			a.removeClass('doing')
		},function(){
			a.removeClass('doing')
		})
		return p
	}
	
	var pages=[],currentPage={section:null,aside:null},
		Page=Parse.View.extend({
			clazz:'Page',
			tagName:'section',
			title:'Default Page',
			navs:'<a onclick="history.go(-1)"><span class="icon left-sign"/></a>\
				<a href="#"><span class="icon home"/></a>\
				<a class="on-right"><span class="icon refresh"/></a>',
			content:'empty content',
			cmds:'',
			template:_.template('<header><h1 class="title centered">{{title}}</h1><nav>{{navs}}</nav></header><article class="active scroll">{{content}}</article><footer><nav>{{cmds}}</nav></footer>'),
			events:{'click header .refresh': 'refresh'},
			constructor: function(){
				pages.push(this)
				Parse.View.prototype.constructor.apply(this,arguments)
			},
			initialize: function(){
				this.$el.data('transition','slide')
				if(!Parse.User.current())
					this.navs+='<a class="on-right" href="#user/signin"><span class="icon user"/></a>'
				$(document.body).append(this.$el.html(this.template(this)))
				if(!this.cmds)
					this.$('footer').hide()
			},
			loading: function(a){
				this.$('span.refresh').parent()[a===false?'removeClass':'addClass']('doing')
			},
			refresh: function(){
				return this
			},
			setTitle:function(t){
				this.$('header h1').html(t)
				return this
			},
			show: function(){
				currentPage[this.tagName] && currentPage[this.tagName].hide()
				this.$el.addClass('show')
					.one('webkitAnimationEnd animationend',function(){
						//$(this).data('direction','')
					}).data('direction','in')
					
				currentPage[this.tagName]=this
				return this
			},
			hide: function(){
				this.clear()
				this.$el.removeClass('show')
					.data('direction','out')
				return this
			},
			clear: function(){
				return this
			}
		}),
		ListPage=Page.extend({
			content:'<ul/>',
			itemTemplate:false,
			initialize: function(){
				Page.prototype.initialize.apply(this,arguments)
				this.$list=this.$('article>ul')
				this.$('article').addClass('list')
				if(_.isString(this.itemTemplate))
					this.itemTemplate=_.template($(this.itemTemplate).html())
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
				this.$list.find('#'+item.id).remove()
				return this
			},
			changeOne: function(item){
				this.$list.find('#'+item.id).replaceWith(this.itemTemplate(item))
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
						history.go(-1)
					})
				return false
			},
			clear: function(){
				this.$('form').get(0).reset()
				delete this.model
				return Page.prototype.clear.apply(this,arguments)
			},
			onAdded: function(m){},
			onChanged: function(m){}
		})
	
	return {Page:Page,FormPage:FormPage,ListPage:ListPage}
})