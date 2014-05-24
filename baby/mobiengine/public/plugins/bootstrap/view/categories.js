define(['app','UI','i18n!../nls/i18n'],function(app,UI,i18n){
	var tmplCates='\
		<li class="thumb" id="_{{id}}">\
			<img src="{{getUrl("thumbnail")}}">\
			<div>\
				<strong><a href="#category/{{id}}/{{get("name")}}">{{get("name")}}</a></strong>\
				<small>{{get("desc")}}</small>\
				<a class="on-right" href="#create/{{id}}/{{get("name")}}" style="cursor:pointer">\
					<span class="icon plus"/></a>\
			</div>\
		</li>'
	var Tag=app.Tag
	return UI.ListPage.extend({
		cmds:'<a href="#favorites"><span class="icon star"/></a>\
			<a href="#tasks"><span class="icon tasks"/></a>\
			<a href="#features"><span class="icon apps"/></a>\
			<a href="#sync"><span class="icon sync"/><span class="tag count"/></a>\
			<a href="#test"><span class="icon test"/></a>',
		itemTemplate:_.template(tmplCates),
		collection:Tag.collection(),
		initialize: function(){
			UI.ListPage.prototype.initialize.apply(this,arguments)
			this.$list.addClass('indented')
			return this
		},
		refresh: function(){
			this.collection.reset(Tag.grouped.category)
			return this
		}
	},{
		STYLE:".stat{position:relative;height:300px;background-color:black}"
	})
})