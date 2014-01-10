define(['doc/model'], function(Model){
	return Model.extend({
		type:'r',
		ignores:{rPr:true}
	})
})