define(['app','UI', 'JSZip','i18n!../nls/l10n'],function(App,View, JSZip,i18n){
	var tmplApp='\
		<form >\
			<fieldset>\
				<label>'+i18n('applicaiton name')+':</label>\
				<input type="text" name="name">\
				<label>'+i18n('url')+':</label>\
				<input type="text" name="url">\
			</fieldset>\
			<fieldset>\
				<label>'+i18n('Applicaiton Key')+':</label>\
				<input type="text" name="apiKey" readonly="readonly">\
			</fieldset>\
		</form>'
	var FormPage=View.FormPage, Application=App.Application
	return new (FormPage.extend({
		cmds:'<a><button type="submit"><span class="icon save"/></button>save</a>\
				<a>'+View.FileLoader+i18n('upload')+'</a>\
				<a><span class="icon download">'+i18n('download')+'</a>',
		events:_.extend(FormPage.prototype.events,{
			'change input[type=file]':'upload',
			'click .download':'download',
		}),
		content:tmplApp,
		initialize:function(){
			this._super().initialize.apply(this,arguments)
			Application.all.on('current',this.setModel,this)
		},
		setModel:function(m){
			this._super().setModel.call(this, m || new Application)
			this.setTitle(this.model.id ? this.model.get('name') : i18n("create new application"))
			return this
		},
		show: function(){
			this.setModel(Application.current())
			return this._super().show.apply(this,arguments)
		},
		onAdded:function(a){
			this._super().onAdded.apply(this,arguments)
			Application.current(a)
			this.$('form input[name=apiKey]').val(a.get('apiKey'))
			return this
		},
		hide: function(){
			if(!this.model.id)
				Application.restoreCurrent()
			return this._super().hide.apply(this,arguments)
		},
		download: function(){
			var currentApp=this.model
			return currentApp.download().then(function(zip){
				zip.file("cloud/main.js", currentApp.get('cloudCode')||'//put your cloud code here')
				currentApp.exportSchema().then(function(schema){
					zip.file("data/schema.js",JSON.stringify(schema,null, "\t"))
					var data={}
					return $.when(_.chain(_.keys(schema)).map(function(table){
						return currentApp.exportData(table)
							.then(function(collection){
								collection.length && (data[table]=collection)
							})
					}).value()).then(function(){
						zip.file("data/data.json",JSON.stringify(data,null, "\t"))
					})
				}).then(function(){
					View.util.save(zip, currentApp.get('name')+'.zip')
				})
			})
		},
		upload: function(){
			
		}
	}))
})