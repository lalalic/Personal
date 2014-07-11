{
	users: {
		_id: String,
		password: String,
		email: {type: String, unique:true},
		posts: Number,
		stories: Number,
		comments: Number,
		score: Number,
		duration: Number,
		dayBeat: Number,
		weekBeat: Number,
		monthBeat: Number,
		yearBeat: Number,
		allBeat: Number
	},
	roels: {
		_id: String,
		roles: [roles],
		users: [users]
	},
	Tag: {
		category: {
			type: String,
			searchable: true
		},
		name: {
			type: String,
			searchable: true
		},
		posts: {
			type: Integer,
			searchable: true
		},
		time: {
			type: Integer,
			searchable: true
		},
		stories:{
			type: Integer
		},
		dayBeat:{
			type: Integer
		},
		weekBeat:{
			type: Integer
		},
		monthBeat:{
			type: Integer
		},
		yearBeat:{
			type: Integer
		},
		allBeat:{
			type: Integer
		}
	},
	Child: {
		author: {
			type: Integer,
			searchable: true
		},
		authorName: {
			type: String,
			searchable: true
		},
		birthday: {
			type: Date,
			searchable: true
		},
		gender: {
			type: Integer,
			searchable: true
		},
		name: {
			type: String,
			searchable: true
		},
		photo: {
			type: File,
			searchable: true
		}
	},
	Post: {
		author: {
			type: Integer,
			searchable: true
		},
		authorName: {
			type: String,
			searchable: true
		},
		content: {
			type: String,
			searchable: true
		},
		comments: {
			type: Integer,
			searchable: true
		},
		category: {
			type: Integer,
			searchable: true
		},
		title: {
			type: String,
			searchable: true
		},
		duration: {
			type: Integer,
			searchable: true
		},
		tags: {
			type: Array,
			searchable: true
		},
		thumbnail: {
			type: String
		}
	},
	Comment: {
		author: {
			type: Integer,
			searchable: true
		},
		authorName: {
			type: String
		},
		content: {
			type: String
		},
		kind:{
			type: String
		},
		parent: {
			searchable: true,
			type: Integer
		}
	},
	Favorite: {
		author: {
			searchable: true,
			unique: false,
			type: Integer
		},
		authorName: {
			searchable: false,
			unique: false,
			type: String
		},
		post: {
			searchable: true,
			unique: false,
			type: Integer
		},
		title: {
			searchable: false,
			unique: false,
			type: String
		}
	},
	Task: {
		author: {
			searchable: true,
			unique: false,
			type: Integer
		},
		authorName: {
			searchable: false,
			unique: false,
			type: String
		},
		child: {
			searchable: true,
			unique: false,
			type: Integer
		},
		planAt: {
			searchable: true,
			unique: false,
			type: Date
		},
		post: {
			searchable: true,
			unique: false,
			type: Integer
		},
		title: {
			searchable: false,
			unique: false,
			type: String
		},
		status: {
			searchable: true,
			unique: false,
			type: Integer
		},
		time: {
			searchable: false,
			unique: false,
			type: Integer
		}
	},
	Story: {
		author: {
			searchable: true,
			unique: false,
			type: Integer
		},
		authorName: {
			searchable: false,
			unique: false,
			type: String
		},
		content: {
			searchable: false,
			unique: false,
			type: String
		},
		thumbnail: {
			searchable: false,
			unique: false,
			type: String
		},
		post:{
			searchable: true,
			type: Integer
		},
		comments:{
			type: Integer
		}
	}
}