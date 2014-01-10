define(function(){
	var O=Backbone.View.extend({})
	O.prototype={}
	return O.extend({
		constructor:function(model,ruleStyle,editor,el){
			this.model=model
			this.style=ruleStyle
			this.editor=editor
			this.el=el
		},
		render: function(){
			_.each(this.model.wXml.children,function(node){
				this[node.localName] && this[node.localName](node)
			},this)
			_.each(this.model.wXml.attributes,function(node){
				this[node.localName] && this[node.localName](node)
			},this)
		},
		fromWord:function(a){
			return parseInt(a)/20.0
		},
		setStyleName: function(e){
			if(!this.el)
				return 
			$(this.el).addClass(this.editor.getStyleClass(e.getAttribute('w:val')))
		},
		asBool:function(node,attr,defaultValue){
			return node.hasAttribute(attr) ? node.getAttribute(attr)=='true' : defaultValue
		}
	})
})