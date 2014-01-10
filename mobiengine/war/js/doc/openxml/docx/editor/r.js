define(['doc/openxml/docx/editor/base','doc/openxml/docx/editor/style/rPr'],function(Editor,RPr){
	return Editor.extend({
		tagName:'span',
		//attributes:{contenteditable:true, spellcheck:false},
		convertStyle:function(){
			_.each(this.model.$('rPr').get(),function(pr){
				new RPr(this.model.getChildModel(pr),this.el.style,this.editor,this.el).render()
			},this)
		},
		onAddContentToEmptyR:function(changes){
			if(!this.model.wXml.parentNode)
				this.parent.model.wXml.appendChild(this.model.wXml)
			var text=changes[0].addedNodes[0],
				br=changes[1].removedNodes[0]
			text.editor=br.editor
			text.editor.setElement(text)
			text.editor.onChangeContent()
		}
	})
})