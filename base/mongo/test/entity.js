describe("Entity Service", function(){
	var host="http://127.0.0.1",
		root=host+"/books";
	
	
	
	jQuery.ajaxSetup({
		async:false,
		dataType:"json",
		headers:{
			"X-Application-Id":"test",
			"X-Session-Token":"test"
		},
		error: function(){
			expect(false).toBe(true)
		}
	})
	
	it("restore Test database",function(){
		jQuery.get(root+"/reset")
			.done(function(result){
				expect(result.ok).toBe(1)
			})
	})

	describe("Search", function(){
		it("get single document", function(){
			jQuery.get(root+"/book1")
				.done(function(data){
					expect(data._id).toBe('book1')
				})
		})
		
		it("get all documents", function(){
			jQuery.get(root)
				.done(function(data){
					expect(data.results.length).toBe(10)
				})
		})
		
		it("support query", function(){
		
		})
		
		it("support limit", function(){
		
		})
		
		it("support order", function(){
		
		})
		
		it("support skip", function(){
		
		})
	})
	
	describe("create" ,function(){
		it("with _id", function(){
			jQuery.post(root,{_id:'a book created with _id'})
				.done(function(data){
					expect(data._id).toBe('a book created with _id')
				})
		})
		
		it("without _id", function(){
			jQuery.post(root,{name:'a book created without _id'})
				.done(function(data){
					expect(data._id).toBeTruthy()
				})
		})
	})
	
	it("update", function(){
		jQuery.ajax({
				type:'put',
				url:root+"/book1",
				data:{author:'raymond'}
			}).done(function(data){
				expect(data.updatedAt).toBeTruthy()
			})
	})
	
	it("delete", function(){
		jQuery.ajax({
			type:'delete',
			url:root+"/book0"
		}).done(function(data){
			expect(data).toBeTruthy()
		})
	})
})