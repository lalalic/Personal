module.exports=require("./entity").extend({
	kind:"plugins"
},{
	schema:{
		_id: "plugins", 
		fields:{_id:"String",createdAt:"Date",updatedAt:"Date",author:"String", ACL:"Object"}
	}
})