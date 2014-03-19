define(['app','UI'],function(App,View){
	var FormPage=View.FormPage, Application=App.Application
	return new (FormPage.extend({
		cmds:'<a><button type="submit"><span class="icon save"/></button></a>',
		content:_.template('#tmplApp',{}),
		initialize:function(){
			FormPage.prototype.initialize.apply(this,arguments)
			Application.all.on('current',this.setModel,this)
		},
		setModel:function(m){
			FormPage.prototype.setModel.call(this, m || new Application)
			this.setTitle(this.model.id ? this.model.get('name') : text("create new application"))
			return this
		},
		show: function(){
			this.setModel(Application.current())
			return FormPage.prototype.show.apply(this,arguments)
		},
		onAdded:function(a){
			FormPage.prototype.onAdded.apply(this,arguments)
			Application.current(a)
			return this
		},
		hide: function(){
			if(!this.model.id)
				Application.restoreCurrent()
			return FormPage.prototype.hide.apply(this,arguments)
		}
	}))
})