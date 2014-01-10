define([].add('doc/openxml/docx/editor/style/','style,rPr,pPr'),function(Style,RPr,PPr){
	return Style.extend({
		render:function(){			
			_.each(this.model.$('pPr').get(),function(ppr){
				this.editor.styleFactory(this.model.getChildModel(ppr),this.createRuleStyle("P")).render()
			},this)
			
			_.each(this.model.$('rPr').get(),function(rpr){
				this.editor.styleFactory(this.model.getChildModel(rpr),this.createRuleStyle("SPAN")).render()
			},this)
		}	
	})
})