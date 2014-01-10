define(['doc/document'],function(Document){
	return Backbone.Model.extend({
		type:false,
		ignores:{},
		constructor:function(wXml, doc, parent){
			this.wXml=wXml
			this.$xml=$(wXml)
			this.document=doc
			this.parent=parent	
			this.type=this.type||wXml.localName
			Backbone.Model.prototype.constructor.apply(this)
			console.debug("found "+this)
		},
		initialize:function(){
			Backbone.Model.prototype.initialize.apply(this)
			this.on('content:change',function(){
				this.document.trigger('content:change')
			},this)
		},
		iterate:function(f, context){
			_.each(this.wXml.children,function(child){
				if(this.ignores[child.localName])
					return
				f.call(context,this.getChildModel(child))
			},this)
		},
		$:function(selector){
			return this.$xml.find(selector)
		},
		attr:function(a){
			return this.wXml.getAttribute(a)
		},
		getChildModel:function(xml){
			if(_.isString(xml)){
				xml=this.$xml.append(xml).get(0).lastChild
				this.wXml.removeChild(xml)
			}
			return this.document.factory(xml,this)
		},
		toString:function(){
			return this.type+"."+this.cid
		}
	})
})