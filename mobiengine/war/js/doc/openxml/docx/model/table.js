define(['doc/model'], function(Model){
	return Model.extend({
		type:'table',
		ignores:{pPr:true}
	})
})