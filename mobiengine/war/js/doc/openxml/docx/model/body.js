define(['doc/model'],function(Model){
	return Model.extend({
		type:'body',
		iterate:function(f, context){
			var me=this,prev=null
			this.$('sectPr').each(function(i,sectPr){
				var section=me.document.factory(sectPr,me)
				section.last = sectPr
				while(section.last.parentNode!=me.wXml)
					section.last=section.last.parentNode

				section.first = prev ? prev.last.nextSibling : me.wXml.firstChild
				f.call(context,prev=section)
			})
		}
	})
})