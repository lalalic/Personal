define(['doc/openxml/docx/editor/base'],function(Editor){
	return Editor.extend({
		tagName:'col',
		convertStyle:function(){
			this.el.style.width=parseInt(this.model.attr('w:w'))/20.0+'pt'
		}
	})
})