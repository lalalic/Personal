exports.base={
	createdAt: Date,
	updatedAt: Date,
	author: String,
	lastModifier: String,
	ACL: Object
};
exports.schema={
	users:{
		schema:{
			_id: String
		}
	},
	roles: {
		schema:{
			_id: String
		}
	},
	plugins:{
		schema:{
			_id: String
		}
	}
};