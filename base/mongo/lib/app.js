module.exports=require("./entity").extend({
	kind:"apps"
},{
	routes:{
		
	},
	resolveAppKey: function(Accesskey){
		return {dbName:"supernaiba"}
	}
})