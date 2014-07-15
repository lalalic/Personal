define(['Plugin','app','UI','i18n!../nls/l10n'],function(Plugin,app,UI,i18n){
	function switchAppKey(e,xhr){
		var current=app.Application.current()
		current && xhr.setRequestHeader("X-Application-Id", current.get('apiKey'))
	}
	return UI.ListPage.extend({
		model: app.Plugin,
		collection: app.Plugin.collection(),
		cmds:'<a class="upload">'+UI.FileLoader+'Upload New Plugin</a>',
		itemTemplate:_.template('<li><% var depends=get("depends")||[];%>\
			<span class="icon {{get("icon")}}"/><strong id="{{id}}">{{get("name")}}-{{get("title")}}</strong>\
			<small>by {{get("authorName")}} for {{get("version")}} <var>{{depends.length && ("depends on:"+depends)}}<var></small>\
			<span>{{get("description")}}&nbsp;</span>\
			<button class="on-right download" data-plugin-id="{{id}}">'+i18n('download')+'</button>\
			<button class="on-right accept upload" data-plugin-id="{{id}}">'+i18n('new version')+'</button>\
			</li>'),
		events:{
			'change a.upload input':'create',
			'click button.download':'download',
			'click button.upload':'newVersion'
		},
		show:function(){
			$(document).on('ajaxSend', switchAppKey)
			return this._super().show.apply(this,arguments)
		},
		close: function(){
			this._super().close.apply(this,arguments)
			$(document).off('ajaxSend', switchAppKey)
			return this
		},
		create: function(e){
			return new FileReader().readAsArrayBuffer(e.target.files[0])
			.then(_.bind(function(data){
				e.target.value=""
				var a=Plugin.parse(data),info=a.info;
				if(this.collection.findWhere({name:info.name})){
					alert("Plugin "+info.name+" already exists, please change name and try again!")
					return
				}
				var plugin=new app.Plugin(_.pick(info,"name,version,description,title,icon,depends".split(",")))
				plugin.setCloudCode(a.cloudCode)
				plugin.setClientCode(a.clientCode)
				plugin.save().then(_.bind(function(){
					this.collection.add(plugin)
					this._emptivible(1)	
				},this))
			},this))
		},
		download: function(e){
			this.collection.get(parseInt($(e.target).data('plugin-id'))).download()
		},
		newVersion:function(e){
			return new FileReader().readAsArrayBuffer(e.target.files[0])
			.then(_.bind(function(data){
				e.target.value=""
				var a=Plugin.parse(data),info=a.info;
				var plugin=this.collection.findWhere({name:info.name});
				if(!plugin){
					alert("Plugin "+info.name+" doesn't exists, please change name and try again!")
					return
				}
				plugin.set(_.pick(info,"version,description,title,icon,depends".split(",")),{silent:true})
				plugin.setCloudCode(a.cloudCode)
				plugin.setClientCode(a.clientCode)
				plugin.save().then(_.bind(function(){
					plugin.trigger('change')
				},this))
			},this))
		},
		EMPTY:_.extend({},UI.ListPage.prototype.EMPTY,{
			type:'plugin',
			title:i18n('No Plugin Yet'),
			description:i18n('Plugin is to extend application features for either server side or client side. You can check <a href="../api/Plugin.html">API document</a> to create your plugins.')
		})
	})
})