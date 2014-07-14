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
	return FormPage.extend({
		cmds:'<a><button type="submit"><span class="icon save"/></button>save</a>\
				<a>'+View.FileLoader+i18n('upload code')+'</a>\
				<a><span class="icon download"/>'+i18n('download code')+'</a>',
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
			this.setTitle(this.model.isNew() ? this.model.id : i18n("create new application"))
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
			if(!this.model || !this.model.id)
				Application.restoreCurrent()
			return this._super().hide.apply(this,arguments)
		},
		download: function(){
			return this.model && this.model.download()
		},
		upload: function(e){
			this.model.upload(e.target.files[0])
			e.target.value=""
		}
	})
})