define(['UI','app','tool/uploader'],function(UI,app,uploader){
	var Child=app.Child
	return new (UI.FormPage.extend({
		model:new Child,
		cmds:'<a><span class="icon user"/></a>\
		<a><span class="icon minus"/></a>\
		<a><button type="submit" form="childForm"><span class="icon ok-sign"/></button></a>',
		events:_.extend({},UI.FormPage.prototype.events,{
			'click form [name=photo]':'selectPhoto',
			'click .icon.user': 'setCurrent',
			'click .icon.minus': 'deleteChild'
		}),
		initialize:function(){
			this.content=_.template('#tmplChild',{})
			return this._super().initialize.apply(this,arguments)
		},
		show: function(id){
			id && (this.model=Child.all.get(id))
			if(!this.model)
				this.model=new Child
			return this._super().show.apply(this,arguments)
		},
		setModel:function(m){
			this._super().setModel.apply(this,arguments)
			//this.model && this.model.has('photo')
			//	&& (f.photo.src=this.model.get('photo').url())
			return this
		},
		clear: function(){
			this.$('form [name=photo]').css('background-image',"")
			return this._super().clear.apply(this,arguments)
		},
		change: function(e){
			var el=e.srcElement
			switch(el.name){
			case 'gender':
				this.model.set('gender',parseInt(el.value),{silent:true})
				break
			default:
				this.model.set(el.name,el.value,{silent:true})
			}
		},
		selectPhoto: function(e){
			var me=this,
				el=e.srcElement
			uploader.bind(el,{
					onSave:function(f,dataUri){
						$(el).css('background-image','url('+dataUri+')')
						me.model.set('photo',f,{silent:true})
					},
					onSaved: function(f){
						$(el).css('background-image','url('+f.url()+')')
					},
					size:150
				}).click()
		},
		onAdded: function(m){
			Child.all.add(m)
		},
		onChanged: function(m){
			m.trigger('change',m)
		},
		setCurrent: function(){
			Child.all.trigger('current',this.model)
			return this
		},
		deleteChild: function(){
			this.model.destroy()
				.then(function(m){
					history.go(-1)
				})
			return this
		}
	}))
})