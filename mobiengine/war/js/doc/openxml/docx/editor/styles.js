define(['doc/openxml/docx/editor/base'],function(Editor){
	return Editor.extend({
		constructor:function(opt,editor){
			opt.el=document.createElement('style')
			opt.el.appendChild(document.createTextNode(""));
			$('head').get(0).insertBefore(opt.el,null)
			this.stylesheet=opt.el.sheet
			this.bodyID='#'+editor.model.getBody().cid
			Editor.apply(this,arguments)
		},
		createRule:function(selector){
			var rules=this.stylesheet.rules,len=rules.length
			this.stylesheet.addRule(this.bodyID+" "+selector,'')
			return this.stylesheet.rules.item(len)
		}
	})
})