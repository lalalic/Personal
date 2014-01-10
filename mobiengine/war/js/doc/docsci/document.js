define(['doc/document','doc/openxml/part'],function(Document,Part){
	return Document.extend({
		vender:"EMC",
		product:'xPresso'
	},{
		is:function(parts){
			return parts["BDTDesign.xml"]
		}
	})
})