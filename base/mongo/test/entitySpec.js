describe("entity", function(){
	var host="http://127.0.0.1/1",
		root=host+"/classes/books",
		$=require('./ajax')(),
		_=require('underscore');
	
	it("restore Test database",function(done){
		$.reset4All(host).then(function(){
			$.get(root+"/reset4Test")
				.then(function(result){
					expect(result.ok).toBe(1)
					done()
				},done)
		},done)
	})

	describe("query with GET", function(done){
		it(":id", function(done){
			$.get(root+"/book1")
				.then(function(data){
					expect(data._id).toBe('book1')
					done()
				},done)
		})
		
		it("not exists get with id should return error", function(done){
			$.get(root+"/booknoexist",{error:null})
				.then(function(data){
					$.fail()
					done()
				},function(error){
					expect(error).toBe('Not exists')
					done()
				})
		})
		
		it("[all]", function(done){
			$.get(root)
				.then(function(data){
					expect(data.results.length).toBe(10)
					done()
				},done)
		})
		
		it('?query={name:"raymond"}', function(done){
			var name='book0'
			$.get(root+"?query="+JSON.stringify({name:name}))
				.then(function(data){
					expect(data.results).toBeDefined()
					expect(data.results.length).toBe(4)
					_.each(data.results,function(book){
						expect(book.name).toBe(name)		
					})
					done()
				},done)
		})
		
		it("?limit=n", function(done){
			var name='book0'
			$.get(root+"?limit=2&query="+JSON.stringify({name:name}))
				.then(function(data){
					expect(data.results).toBeDefined()
					expect(data.results.length).toBe(2)
					_.each(data.results,function(book){
						expect(book.name).toBe(name)		
					})
					done()
				},done)
		})
		
		it("direct doc recturned from ?limit=1", function(done){
			var name='book0'
			$.get(root+"?limit=1&query="+JSON.stringify({name:name}))
				.then(function(data){
					expect(data.name).toBe(name)
					done()
				},done)
		})
		
		it("?skip=n", function(done){
			var name='book0'
			$.get(root+"?skip=3&query="+JSON.stringify({name:name}))
				.then(function(data){
					expect(data.results).toBeDefined()
					expect(data.results.length).toBe(1)
					_.each(data.results,function(book){
						expect(book.name).toBe(name)		
					})
					done()
				},done)
		})
		
		it("?sort={name:1}", function(done){
			$.get(root+"?limit=2&skip=7&sort="+JSON.stringify({name:1}))
				.then(function(data){
					expect(data.results).toBeDefined()
					expect(data.results.length).toBe(2)
					expect(data.results[0].name).toBe("book7")
					expect(data.results[1].name).toBe("book8")
					done()
				},done)
		})
		
		it("?sort={name:-1}", function(done){
			$.get(root+"?limit=2&sort="+JSON.stringify({name:-1}))
				.then(function(data){
					expect(data.results).toBeDefined()
					expect(data.results.length).toBe(2)
					expect(data.results[0].name).toBe("book9")
					expect(data.results[1].name).toBe("book8")
					done()
				},done)
		})
		
		it("?fields={name:1}", function(done){
			$.get(root+"/book1?fields="+JSON.stringify({name:1}))
				.then(function(doc){
					expect(doc.name).toBeDefined()
					done()
				},done)
		})
		
		it("?fields={name:0}", function(done){
			$.get(root+"/book1?fields="+JSON.stringify({name:0}))
				.then(function(doc){
					expect(doc.name).toBeUndefined()
					done()
				},done)
		})
	})
	
	describe("create with POST" ,function(){
		it("with _id", function(done){
			var id='a book created with _id'
			$.ajax({type:'post',url:root,data:{_id:id}})
				.then(function(data){
					expect(data._id).toBe(id)
					done()
				},done)
		})
		
		it("without _id", function(done){
			var name='a book created without _id'
			$.ajax({type:'post',url:root,data:{name:name}})
				.then(function(data){
					expect(data._id).toBeTruthy()
					done()
				},done)
		})
	})
	
	describe('update with PUT/PATCH', function(){
		it("replace update with PUT", function(done){
			$.ajax({
					type:'put',
					url:root+"/book1",
					data:{author:'raymond'}
				}).then(function(data){
					expect(data.updatedAt).toBeTruthy()
					return $.get(root+"/book1")
						.then(function(doc){
							expect(doc.name).toBeUndefined()
							expect(doc.author).toBe('raymond')
							done()
						},done)
				},done)
		})
		
		it("patch update with PATCH", function(done){
			$.ajax({
					type:'patch',
					url:root+"/book2",
					data:{author:'raymond'}
				}).then(function(data){
					expect(data.updatedAt).toBeTruthy()
					return $.get(root+"/book2")
						.then(function(doc){
							expect(doc.name).toBeDefined()
							expect(doc.author).toBe('raymond')
							done()
						},done)
				},done)
		})
	})
	
	it("delete with DELETE", function(done){
		$.ajax({
			type:'delete',
			url:root+"/book0"
		}).then(function(data){
			expect(data).toBeTruthy()
			done()
		},done)
	})
})