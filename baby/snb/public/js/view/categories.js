define(['app','view/base','tool/offline'],function(app,View,offline){
	$('body').append('<style>\
		.stat{position:relative;height:300px;background-color:black}\
		</style>')
	var ListPage=View.ListPage, Tag=app.Tag
	return new (ListPage.extend({
		title:text('Super Daddy'),
		cmds:'<a href="#favorites"><span class="icon star"/></a>\
			<a href="#tasks"><span class="icon tasks"/></a>\
			<a href="#sync"><span class="icon sync"/><span class="tag count"/></a>\
			<a href="#test"><span class="icon test"/></a>',
		itemTemplate:'#tmplCates',
		collection:new Parse.Collection,
		initialize: function(){
			ListPage.prototype.initialize.apply(this,arguments)
			this.$list.addClass('indented')
			this.collection.reset(Tag.grouped.category)
			if(!!$.os.phone)
				this.$('header nav a:first-child').prop('onclick',null)
			this.$sync=this.$el.find('footer span.sync').parent()
		},
		clear: function(){
			return this
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