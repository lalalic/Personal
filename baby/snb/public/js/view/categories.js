define(['app','view/base'],function(app,View){
	var ListPage=View.ListPage, Tag=app.Tag
	return new (ListPage.extend({
		title:'SNB',
		cmds:'<a href="#favorites"><span class="icon star"/></a>\
			<a href="#tasks"><span class="icon list"/></a>\
			<a href="#test"><span class="icon certificate"/></a>',
		itemTemplate:'#tmplCates',
		collection:new Parse.Collection,
		initialize: function(){
			ListPage.prototype.initialize.apply(this,arguments)
			this.$('article').addClass('indented')
			this.collection.reset(Tag.grouped.category)
			if(!!$.os.phone)
				this.$('header nav a:first-child').prop('onclick',null)
		},
		clear: function(){
			return this
		},
		back: function(e){
			if($.media=='phone'){
				var aside=require('view/children'),
					$icon=$(e.srcElement)
				if(aside.$el.hasClass('show')){
					this.$el
						.one('webkitAnimationEnd animationend',function(){
							aside.hide()
						}).data('aside-left','hide')
					$icon.removeClass('left-sign').addClass('right-sign')
				}else{
					aside.show()
					this.$el.data('aside-left','show')
					$icon.removeClass('right-sign').addClass('left-sign')
				}
			}else
				ListPage.prototype.back.apply(this,arguments)
		}
	}))
})