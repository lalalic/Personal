define(['doc/document','doc/openxml/part'],function(Document,Part){
	return Document.extend({
		vender:"Microsoft",
		product:'Office 2010',
		getPart:function(name){
			var part=this.parts[name]
			if(part.constructor==Part)
				return part
			else
				return this.parts[name]=new Part(name,this)
		},
		getImageURL:function(name){
			return URL.createObjectURL(new Blob([this.parts[name].asArrayBuffer()],{type:"image/*"}))
		}
	})
})