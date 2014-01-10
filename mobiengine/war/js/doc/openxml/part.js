define(['doc/part'],function(Part){
	return Part.extend({
		_p:'<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n',
		constructor:function(name,doc){
			Backbone.Model.prototype.constructor.apply(this,arguments)
			this.name=name
			this.doc=doc
			this.changed=false
			var i=this.name.lastIndexOf('/');
			if(i==-1){
				this.folder=""
				this.relName="_rels/"+this.name+".rels";
			}else{
				this.folder=this.name.substring(0,i)
				this.relName=this.folder+"/_rels/"+this.name.substring(i+1)+".rels";
			}
			this.root=$.parseXML(doc.parts[this.name].asText()).documentElement
			this.rels={}
			if(doc.parts[this.relName]){
				var me=this
				$('Relationship',$.parseXML(doc.parts[this.relName].asText()).documentElement)
				.each(function(){
					me.rels[this.getAttribute('Id')]={
						type:this.getAttribute('Type').split('/').pop(),
						target:me.folder+"/"+this.getAttribute('Target')}
				})
			}
		},
		asText:function(){
			return this._p+this.root.outerHTML
		},
		getRel:function(id){
			var rel=this.rels[id]
			switch(rel.type){
			case 'image':
				return this.doc.getImageURL(rel.target)
			default:
				return this.doc.getPart(rel.target)	
			}
			
		}
	})
})