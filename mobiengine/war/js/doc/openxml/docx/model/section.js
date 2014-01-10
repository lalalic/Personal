define(['doc/model'], function(Model){
	return Model.extend({
		type:'section',
		iterate:function(f, context){
			var current=this.first
			while(current!=this.last){
				f.call(context,(this.getChildModel(current)))
				current=current.nextSibling
			}
			if(this.last!=this.wXml)
				f.call(context,this.getChildModel(this.last))
		}
	})
})