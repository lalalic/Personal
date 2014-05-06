/**
 * create and update Children
 * @module Child 
 * @requires UI
 * @requires uploader
 */
define(['UI','app','tool/ImageUploader'],function(UI,app,uploader){
	var tmplChild='\
		<form>\
			<fieldset><input type="text" name="name" placeholder="'+text('baby name')+'"></fieldset>\
			<fieldset>\
				<select name="gender">\
					<option value=0>'+text('Boy')+'</option>\
					<option value=1>'+text('Girl')+'</option>\
				</select>\
			</fieldset>\
			<fieldset><input type="date" name="birthday" placeholder="'+text('birthday')+'"></fieldset>\
			<fieldset>\
				<div name="photo" style="width:150px;height:150px;border:1px solid;display:block;margin:0px auto;background-repeat:no-repeat;background-position:center center"/>\
			</fieldset>\
		</form>'
	
	var Child=app.Child
	return new (UI.FormPage.extend({
		model:new Child,
		collection: Child.all,
		content:tmplChild,
		cmds:'<a><span class="icon user"/></a>\
		<a><span class="icon remove"/></a>\
		<a><button type="submit" form="childForm"><span class="icon save"/></button></a>',
		events:_.extend({},UI.FormPage.prototype.events,{
			'click form [name=photo]':'selectPhoto',
			'click .icon.user': 'setCurrent',
			'click .icon.remove': 'deleteChild'
		}),
		show: function(id){
			this.setModel(id&&Child.all.get(parseInt(id))||new Child)
			return this._super().show.apply(this,arguments)
		},
		setModel:function(m){
			this._super().setModel.apply(this,arguments)
			if(this.model && this.model.has('photo'))
				this.$('form div[name=photo]')
					.css('background-image','url('+this.model.get('photo')+')')
			return this
		},
		clear: function(){
			this.$('form [name=photo]').css('background-image',"")
			return this._super().clear.apply(this,arguments)
		},
		selectPhoto: function(e){
			var me=this, el=e.target
			uploader.bind(el,{
				onSave:function(f,dataUri){
					$(el).css('background-image','url('+dataUri+')')
				},
				onSaved: function(f){
					$(el).css('background-image','url('+f.url()+')')
					me.model.set('photo',f.url(),{silent:true})
				},
				size:150
			}).click()
		},
		setCurrent: function(){
			Child.all.trigger('current',this.model)
			return this
		},
		deleteChild: function(){
			this.model.destroy()
				.then(_.bind(function(m){
					this.back()
				},this))
			return this
		}
	}))
})