define(["UI","Plugin","app"],function(UI,Plugin, app){
	var tmplFeature='<li>\
		<span class="icon {{get("icon")}}"/><strong>{{get("title")||get("name")}}</strong>\
		<span>by {{get("author").name}} for {{get("version")}}</span>\
		<small>{{get("description")}}</small>\
		<small></small>\
		<button class="small on-right test" data-plugin-id="{{id}}">Test</button>\
		</li>'
	return new (UI.ListPage.extend({
		title:'Plugin List',
		collection:Plugin.features,
		itemTemplate:_.template(tmplFeature),
		cmds:'<a class="upload">'+UI.FileLoader+'Upload New Plugin</a>',
		events:{
			'change a.upload input':'parse',
			'click button.test':'test'
		},
		refresh: function(){
			this.collection.trigger('reset')
			return this
		},
		parse: function(e){
			var reader=new FileReader
			reader.onloadend=_.bind(function(a){
				var plugin=Plugin.parse(a.target.result)
				this.addOne(plugin.info())
			},this)
			reader.readAsArrayBuffer(e.target.files[0])
			e.target.value=""
		},
		test: function(e){
			Plugin.features.get($(e.target).data('plugin-id'))
		}
	}))
})