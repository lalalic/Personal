define(['app','UI'],function(App,View){
	var FormPage=View.FormPage, Application=App.Application
	return new (FormPage.extend({
		cmds:'<a><button type="submit"><span class="icon save"/></button></a>',
		content:_.template('#tmplApp',{}),
		initialize:function(){
			this._super().initialize.apply(this,arguments)
			Application.all.on('current',this.setModel,this)
		},
		setModel:function(m){
			this._super().setModel.call(this, m || new Application)
			this.setTitle(this.model.id ? this.model.get('name') : text("create new application"))
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
		}
	}))
})