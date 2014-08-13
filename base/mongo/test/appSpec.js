describe("app", function(){
var host="http://127.0.0.1/1",
		root=host+"/apps",	
		$=require('./ajax')(),
		_=require('underscore');
	
	$.ajaxSetup({
		headers:{
			"X-Application-Id":"admin",
			"X-Session-Token":"test"
		}
	})
	
	it("restore application Test database",function(done){
		$.reset4All(host).then(done,done)
	})
	
	xdescribe("application", function(){
		it("data should be seperated", function(){
				
		})
	})
	
	describe("user", function(){
		describe("create", function(){
			it("can create new application, and return application token, and author should be set", function(done){
				var data={_id:"testCreate", name:"testCreate"}
				$.ajax({url:root,type:'post',data:data})
					.then(function(doc){
						expect(doc._id).toBeDefined()
						expect(doc.apiKey).toBeDefined()
						expect(doc.createdAt).toBeDefined()
						$.get(root+"/testCreate")
							.then(function(doc){
								expect(doc.author).toBeDefined()
								expect(doc.author.username).toBe('test')
								done()
							},done)
					},done)
			})
			
			it("can't create application with same name within an org", function(done){
				$.ajax({url:root,type:'post',data:{name:"test10",url:"_test"}})
					.then(function(doc){
						expect(doc._id).toBeDefined()
						expect(doc.apiKey).toBeDefined()
						expect(doc.createdAt).toBeDefined()
						$.post(root,{data:{name:"test10"},error:null})
							.then(function(doc){
								$.fail()
								done()
							},function(error){
								expect(error).toMatch(/duplicate key/gi)
								done()
							})
					},done)
			})
			
			it("can't create application with empty name", function(done){
				$.ajax({url:root, type:'post', data:{url:'ok'},error:null})
					.then(function(doc){
						$.fail()
						done()
					},function(error){
						expect(error).toMatch(/empty/gi)
						done()
					})
			})
		})
					
		describe("update", function(){
			it("can update its own application", function(done){
				$.ajax({
					type:'patch',
					url:root+"/test1",
					data:{url:'test1'}
				}).then(function(doc){
					expect(doc.updatedAt).toBeDefined()
					done()
				},done)
			})
			
			it("can NOT update other's application", function(done){
				$.ajax({
					type:'patch',
					url:root+"/test19",
					data:{url:'test19'},
					error:null,
				}).then(function(doc){
					expect(doc).toBeFalsy()
					done()
				},function(error){
					expect(error).toBeTruthy()
					done()
				})
			})
			
			it("can't update name to be duplicated", function(done){
				var newName="test"
				$.ajax({
					type:'patch',
					url:root+"/test1",
					data:{name:newName},
					error: null,
				}).then(function(doc){
					$.fail()
					done()
				},function(error){
					expect(error).toMatch(/duplicate/gi)
					done()
				})
			})
			
			it("can update cloud code", function(done){
				var code="1=1"
				$.ajax({
					type:'patch',
					url:root+"/test1",
					data:{cloudCode:code}
				}).then(function(doc){
					expect(doc.updatedAt).toBeDefined()
					$.get(root+"/test1")
					.then(function(doc){
						expect(doc.cloudCode).toBe(code)
						done()
					},done)
				},done)
			})
			
			it("should throw error when there's error in cloud code", function(done){
				var code="var a }";
				$.ajax({
					type:'patch',
					url:root+"/test1",
					data:{cloudCode:code},
					error:null
				}).then(function(doc){
					$.fail()
					done()
				},function(error){
					expect(error).toBe("Unexpected token }")
					done()
				})
			})
		
		})

		describe("delete",function(){
			it("can be deleted with confirmation", function(){
				
			})
			
			it("can't be deleted without confirmation", function(){
			
			})
		})
		
		describe("query", function(){
			it("can not get any information without admin key", function(done){
				$.get(root,{headers:{
						"X-Application-Id":"test",
						"X-Session-Token":"test"
					}, error: null})
				.then(function(docs){
					$.fail()
					done()
				},function(error){
					expect(error).toMatch(/no hack/gi)
					done()
				})
			})
			
			it("can get its own applictions", function(done){
				$.get(root)
				.then(function(docs){
					_.each(docs.results, function(doc){
						expect(doc.author.username).toBe('test')
					})
					done()
				},done)
			})
			
			it("can NOT get others applictions by id", function(done){
				$.get(root+"/admin",{error:null})
				.then(function(doc){
					$.fail()
					done()
				},function(error){
					expect(error).toBe('no hack')
					done()
				})
			})
			
			it("can NOT get others applictions by query", function(done){
				$.get(root+"?query="+JSON.stringify({"author._id":"lalalic"}))
					.then(function(docs){
						_.each(docs.results, function(doc){
							expect(doc.author.username).toBe('test')
						})
						done()
					},done)
			})
		})
	})
})