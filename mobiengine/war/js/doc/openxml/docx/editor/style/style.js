define(['doc/openxml/docx/editor/base'],function(Editor){
	return Editor.extend({
		initialize:function(){
			Editor.prototype.initialize.apply(this,arguments)
			this.type=this.model.wXml.getAttribute('w:type')
			this.isDefault=this.model.wXml.getAttribute('w:default')=='1'
		},
		createRuleStyle:function(selector){
			return this.parent.createRule(selector).style
		},
		render:function(){
			var selector="",styles=[], id=this.model.wXml.getAttribute('w:styleId')
			if(this.isDefault)
				this.editor.defaultStyles[id]=true
				
			_.each(this.model.$('basedOn').get(),function(basedOn){
				var parentID=basedOn.getAttribute('w:value')
				if(!this.editor.defaultStyles[parentID])
					this.editor.styleParent[id]=parentID
			},this)
			
			switch(this.type){
			case 'paragraph':
				selector="P"
				styles=this.model.$('pPr').get()
				break
			case 'table':
				selector="Table"
				styles=this.model.$('pPr,tblPr').get()
				break
			case 'character':
				selector="Span"
				styles=this.model.$('rPr').get()
				break
			}
			
			if(selector=="" || !this.isDefault)
				selector+=("."+id)
				
			var rule=this.createRuleStyle(selector)
			_.each(styles,function(style){
				this.editor.styleFactory(this.model.getChildModel(style),rule).render()
			},this)
		}
	})
})