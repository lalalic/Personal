define(["UI","Plugin","app", "i18n!../nls/all"],function(UI,Plugin, app,i18n){
	var tmplFeature='<li><%var plugin=require(id),depends=_.map(plugin.getDepends(),function(a){return "<button>"+a+"</button>"});%>\
		<span class="icon {{get("icon")}}"/><strong id="{{id}}">{{id}}-{{get("title")}}</strong>\
		<small>by {{get("author").name}} for {{get("version")}} <var>{{depends.length && ("depends on:"+depends)}}<var></small>\
		<span>{{get("description")}}</span>\
		<button class="on-right test" data-plugin-id="{{id}}">'+i18n('Test')+'</button>\
		<button class="on-right {{(plugin.installed&&"cancel un"||"accept ")+"install"}}" data-plugin-id="{{id}}">{{(plugin.installed&&"un"||"")+"install"}}</button>\
		</li>'
	return new (UI.ListPage.extend({
		title:'Plugin List',
		collection:Plugin.features,
		itemTemplate:_.template(tmplFeature),
		cmds:'<a class="upload">'+UI.FileLoader+'Upload New Plugin</a>',
		events:{
			'change a.upload input':'upload',
			'click button.test':'test',
			'click button.install':'install',
			'click button.uninstall':'uninstall'
		},
		initialize: function(){
			this._super().initialize.apply(this,arguments)
			Plugin.on('install',this.onInstall,this)
			Plugin.on('uninstall',this.onUninstall,this)
		},
		refresh: function(){
			var f=_.bind(function(){this.collection.trigger('reset')},this)
			Plugin.featuresLoaded().then(f,f)
			return this
		},
		upload: function(e){
			var file=e.target.files[0],
				name=file.name.replace(/\.zip$/,'');
			Plugin.upload(name, file)
				.then(function(){
					require.defined("Plugin!"+name) && require.undef("Plugin!"+name)
					require.defined(name) && require.undef(name)
					require(['Plugin!'+name])
				}).always(function(){
					e.target.value=""
				})
		},
		test: function(e){
			Plugin.features.get($(e.target).data('plugin-id'))
		},
		install: function(e){
			var pluginId=$(e.target).data('plugin-id')
			require.defined(pluginId) && require(pluginId).install()
		},
		onInstall: function(pluginId){
			this.$('button.install[data-plugin-id='+pluginId+']')
				.removeClass('accept install')
				.addClass('cancel uninstall')
				.text(i18n('uninstall'))
		},
		uninstall: function(e){
			var pluginId=$(e.target).data('plugin-id')
			require.defined(pluginId) && require(pluginId).uninstall()
		},
		onUninstall: function(pluginId){
			this.$('button.uninstall[data-plugin-id='+pluginId+']')
				.removeClass('cancel uninstall')
				.addClass('accept install')
				.text(i18n('install'))
		}
	}))
})