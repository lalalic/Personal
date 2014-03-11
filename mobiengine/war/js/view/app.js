define(['app','UI'],function(App,View){
	var FormPage=View.FormPage, Application=App.Application
	return new (FormPage.extend({
		cmds:'<a><button type="submit"><span class="icon save"/></button></a>',
		content:_.template('#tmplApp',{}),
		initialize:function(){
			FormPage.prototype.initialize.apply(this,arguments)
			Application.all.on('current',this.changeCurrent,this)
		},
		changeCurrent:function(m){
			this.model=Application.current() || new Application
			this.setTitle(this.model.id ? this.model.get('name') : text("create new application"))
			this.render()
		},
		show: function(){
			this.model=Application.current() || new Application
			this.setTitle(this.model.id ? this.model.get('name') : text("create new application"))
			FormPage.prototype.show.apply(this,arguments)
		},
		render:function(){
			var f=this.$('form').get(0)
			f.reset()
			if(this.model.has('name'))
				f.name.value=this.model.get('name')
			if(this.model.has('url'))
				f.url.value=this.model.get('url')
			if(this.model.has('apiKey'))
				f.apiKey.value=this.model.get('apiKey')
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