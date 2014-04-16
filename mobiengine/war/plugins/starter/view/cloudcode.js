define(['app','UI'],function(app,View){
	var Application=app.Application, 
		FormPage=View.FormPage
	return new (FormPage.extend({
		title:text('Cloud Code'),
		cmds:'<a><button type="submit"><span class="icon save"/></button></a>\
			<a><span class="icon load" onclick="$(this).next().click()"/><input class="outview" type="file" onchange=""></a>',
		events: _.extend({},FormPage.prototype.events,{
			"change input[type=file]": "upload"
		}),
		content:"<form><fieldset><textarea name='cloudCode' spellcheck='false' placeholder='write your cloud code'></textarea></fieldset></form>",
		initialize:function(){
			this._super().initialize.apply(this,arguments)
			Application.all.on('current',this.setModel,this)
		},
		show: function(){
			this.setModel(Application.current())
			this._super().show.apply(this,arguments)
			this.$('textarea').height(this.$('article').height()+"px")
			return this
		},
		save: function(){
			this.model.saveCloudCode()
			return this
		},
		upload:function(e){
			var me=this,
				reader=new FileReader()
			reader.onloadend=function(e){
				me.model.set('cloudCode',e.target.result)
				me.save()
			}
			reader.readAsText(e.target.files[0])
		}
	}))
})