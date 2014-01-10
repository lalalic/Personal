define(['doc/model'], function(Model){
	return Model.extend({
		type:'t',
		getContent:function(){
			return this.wXml.textContent
		},
		setContent:function(content){
			this.wXml.textContent=content
			this.document.trigger('content:change')
		}
	})
})