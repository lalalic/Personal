define(['doc/openxml/docx/editor/base'],function(Editor){
	return Editor.extend({
		constructor:function(opt){
			var text=opt.model.getContent()
			if(text)
				opt.el=document.createTextNode(text)
			else
				opt.tagName='br'
			Editor.apply(this,arguments)
		},
		onChangeContent:function(changes){
			this.model.setContent(this.el.textContent)
		}
	})
})