define(["UI","Plugin","app"],function(UI,Plugin, app){
	var tmplFeature='<li><span class="icon {{get("icon")}}"/><strong>{{get("title")||get("name")}}</strong>\
		<small>{{get("description")}}</small>\
		<div class="on-right">{{get("author").name}}</div>\
		<div class="on-right">{{get("version")}}</div></li>';
	return new (UI.ListPage.extend({
		title:'Plugin List',
		collection:Plugin.features,
		itemTemplate:_.template(tmplFeature),
		cmds:'<a>'+UI.FileLoader+'Upload New Plugin</a>',
		event:{
			'change footer nav input':'upload'
		},
		refresh: function(){
			this.collection.trigger('reset')
			return this
		},
		upload: function(e){
			new app.File(e).save()
		}
	}));
})