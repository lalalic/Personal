define(['doc/model'], function(Model){
	return Model.extend({
		type:'image',
		getContent:function(){
			return []
		},
		getSrc:function(){
			if(this.src)
				return this.src
			var blip=this.$('blip'), rid=blip.attr('r:embed')
			return this.src=this.document.main.getRel(rid)
		}
	})
})