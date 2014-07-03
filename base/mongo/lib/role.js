module.exports=require('./entity').extend({
	kind: "roles"
},{
	schema:{
		_id: "roles", 
		fields:{_id:"String",members:{users:["String"],roles:["String"]}, createdAt:"Date",updatedAt:"Date",author:"String", ACL:"Object"}
	}
})