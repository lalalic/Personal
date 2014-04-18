{
	"_user": {
		"username": {
			"unique": true,
			"type": "String",
			"searchable": true
		},
		"password": {
			"type": "String"
		},
		"email": {
			"unique": true,
			"type": "String",
			"searchable": true
		},
		"comments": {
			"type": "Integer"
		},
		"post": {
			"type": "String"
		},
		"score": {
			"type": "String"
		}
	},
	"_role": {
		"name": {
			"unique": true,
			"type": "String",
			"searchable": true
		},
		"roles": {
			"type": "Array"
		},
		"users": {
			"type": "Array"
		}
	},
	"Tag": {
		"category": {
			"type": "String",
			"searchable": true
		},
		"name": {
			"type": "String",
			"searchable": true
		},
		"posts": {
			"type": "Integer",
			"searchable": true
		},
		"time": {
			"type": "String",
			"searchable": true
		}
	},
	"Child": {
		"author": {
			"type": "Integer",
			"searchable": true
		},
		"authorName": {
			"type": "String",
			"searchable": true
		},
		"birthday": {
			"type": "Date",
			"searchable": true
		},
		"gender": {
			"type": "Integer",
			"searchable": true
		},
		"name": {
			"type": "String",
			"searchable": true
		},
		"photo": {
			"type": "File",
			"searchable": true
		}
	},
	"Post": {
		"author": {
			"type": "Integer",
			"searchable": true
		},
		"authorName": {
			"type": "String",
			"searchable": true
		},
		"content": {
			"type": "String",
			"searchable": true
		},
		"comments": {
			"type": "Integer",
			"searchable": true
		},
		"category": {
			"type": "String",
			"searchable": true
		},
		"title": {
			"type": "String",
			"searchable": true
		},
		"duration": {
			"type": "String",
			"searchable": true
		},
		"tags": {
			"type": "Array"
		},
		"thumbnail": {
			"type": "String"
		}
	},
	"Comment": {
		"author": {
			"type": "Integer",
			"searchable": true
		},
		"authorName": {
			"type": "String"
		},
		"content": {
			"type": "String"
		}
	},
	"Favorite": {
		"author": {
			"searchable": true,
			"unique": false,
			"type": "Integer"
		},
		"authorName": {
			"searchable": false,
			"unique": false,
			"type": "String"
		},
		"post": {
			"searchable": true,
			"unique": false,
			"type": "Integer"
		},
		"title": {
			"searchable": false,
			"unique": false,
			"type": "String"
		}
	},
	"Task": {
		"author": {
			"searchable": true,
			"unique": false,
			"type": "Integer"
		},
		"authorName": {
			"searchable": false,
			"unique": false,
			"type": "String"
		},
		"child": {
			"searchable": true,
			"unique": false,
			"type": "Integer"
		},
		"planAt": {
			"searchable": true,
			"unique": false,
			"type": "Date"
		},
		"post": {
			"searchable": true,
			"unique": false,
			"type": "Integer"
		},
		"title": {
			"searchable": false,
			"unique": false,
			"type": "String"
		},
		"status": {
			"searchable": true,
			"unique": false,
			"type": "Integer"
		},
		"time": {
			"searchable": false,
			"unique": false
		}
	},
	"Story": {
		"author": {
			"searchable": true,
			"unique": false
		},
		"authorName": {
			"searchable": false,
			"unique": false,
			"type": "String"
		},
		"content": {
			"searchable": false,
			"unique": false
		},
		"thumbnail": {
			"searchable": false,
			"unique": false
		}
	}
}