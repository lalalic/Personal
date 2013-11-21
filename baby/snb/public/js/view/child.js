define(['view/base','app','tool/uploader'],function(View,app,uploader){
	var FormPage=View.FormPage, Child=app.Child
	return new (FormPage.extend({
		cmds:'<a><span class="icon user"/></a>\
		<a><span class="icon minus"/></a>\
		<a><button type="submit" form="childForm"><span class="icon ok-sign"/></button></a>',
		events:_.extend({},FormPage.prototype.events,{
			'click form img':'selectPhoto',
			'click .icon.user': 'setCurrent',
			'click .icon.minus': 'deleteChild'
		}),
		initialize:function(){
			this.content=_.template('#tmplChild',{})
			FormPage.prototype.initialize.apply(this,arguments)	
		},
		show: function(id){
			id && (this.model=Child.all.get(id))
			if(!this.model)
				this.model=new Child
			this.render()
			return FormPage.prototype.show.apply(this,arguments)
		},
		render:function(){
			var f=this.$('form').get(0)
			if(this.model.has('name'))
				f.name.value=this.model.get('name')
			f.birthday.value=this.model.get('birthday')
			if(this.model.has('photo'))
				f.photo.src=this.model.get('photo').url()
			this.$('form select[name=gender]').val([this.model.get('gender')])
			return this
		},
		clear: function(){
			this.$('form img').get(0).src=""
			return FormPage.prototype.clear.apply(this,arguments)
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
		selectPhoto: function(){
			var me=this,
				img=this.$('form img').get(0)
			uploader.bind(img,{
					onSave:function(f,dataUri){
						img.src=dataUri
						me.model.set('photo',f,{silent:true})
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