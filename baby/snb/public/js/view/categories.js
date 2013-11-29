define(['app','view/base','tool/offline'],function(app,View,offline){
	$('body').append('<style>\
		.stat{position:relative;height:300px;background-color:black}\
		</style>')
	var ListPage=View.ListPage, Tag=app.Tag
	return new (ListPage.extend({
		title:'SNB',
		cmds:'<a href="#favorites"><span class="icon star"/></a>\
			<a href="#tasks"><span class="icon list"/></a>\
			<a href="#sync"><span class="icon upload"/><span class="tag count"/></a>\
			<a href="#test"><span class="icon certificate"/></a>',
		itemTemplate:'#tmplCates',
		collection:new Parse.Collection,
		initialize: function(){
			ListPage.prototype.initialize.apply(this,arguments)
			this.$list.addClass('indented')
			this.collection.reset(Tag.grouped.category)
			if(!!$.os.phone)
				this.$('header nav a:first-child').prop('onclick',null)
			this.$sync=this.$el.find('footer span.upload').parent()
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
		},
		show: function(){
			var pendings=offline.needSync()
			if(pendings)
				this.$sync.show().find('.count').text(pendings)				
			else
				this.$sync.hide();
			return ListPage.prototype.show.apply(this,arguments)
		}
	}))
})