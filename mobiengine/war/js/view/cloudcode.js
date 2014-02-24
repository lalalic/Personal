define(['app','view/base'],function(app,View){
	var Application=app.Application, 
		FormPage=View.FormPage
	return new (FormPage.extend({
		title:text('Cloud Code'),
		cmds:'<a><button type="submit"><span class="icon save"/></button></a>',
		content:"<form><fieldset><textarea name='cloudCode' placeholder='write your cloud code'></textarea></fieldset></form>",
		show: function(){
			this.model=Application.current()
			FormPage.prototype.show.apply(this,arguments)
		},
		render:function(){
			var f=this.$('form').get(0)
			f.reset()
			if(this.model.has('cloudCode'))
				f.cloudCode.value=this.model.get('cloudCode')
		},
		save: function(){
			try{
				$.post('1/apps/cloudcode',{cloudcode:this.model.get('cloudCode')})
			}catch(error){
				
			}
			return false
		}
	}))
})