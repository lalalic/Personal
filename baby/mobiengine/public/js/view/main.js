define(['app','UI'],function(app,UI){
	var Tag=app.Tag
	return new (UI.ListPage.extend({
		cmds:'<a href="#favorites"><span class="icon star"/></a>\
			<a href="#tasks"><span class="icon tasks"/></a>\
			<a href="#sync"><span class="icon sync"/><span class="tag count"/></a>\
			<a href="#test"><span class="icon test"/></a>',
		itemTemplate:'#tmplCates',
		collection:new Tag.collection(),
		initialize: function(){
			this._super().initialize.apply(this,arguments)
			this.$list.addClass('indented')
		},
		refresh: function(){
			this.collection.reset(Tag.grouped.category)
			return this
		}
	},{
		STYLE:".stat{position:relative;height:300px;background-color:black}"
	}))
})