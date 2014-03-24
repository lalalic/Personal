define(['app','UI'],function(app,View){
	var Application=app.Application, 
		FormPage=View.FormPage
	return new (FormPage.extend({
		title:text('Cloud Code'),
		cmds:'<a><button type="submit"><span class="icon save"/></button></a>',
		content:"<form><fieldset><textarea name='cloudCode' placeholder='write your cloud code'></textarea></fieldset></form>",
		initialize:function(){
			this._super().initialize.apply(this,arguments)
			Application.all.on('current',this.setModel,this)
		},
		show: function(){
			this.setModel(Application.current())
			return this._super().show.apply(this,arguments)
		},
		save: function(){
			this.model.patch('cloudCode')
			return this
		}
	}))
})