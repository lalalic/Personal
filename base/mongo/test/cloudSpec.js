describe("cloud", function(){
	var host="http://127.0.0.1/1",
		kind="books",
		root=host+"/classes/"+kind,
		$=require('./ajax')(),
		_=require('underscore'),
		promise=require('node-promise');
	
	it("restore application Test database",function(done){
		$.reset4All(host)
		.then(function(){
			$.get(root+"/reset4Test")
			.then(function(result){
					expect(result.ok).toBe(1)
					done()
				},done)
		},done)
	})
	
	function changeCloudCode(done,f,data,appId){
		var code="("+f.toString()+")(Cloud"+(data ? ","+JSON.stringify(data) : '')+");"
		appId=appId||'test'
		return $.ajax({
			type:'patch',
			url:host+"/apps/"+appId,
			data:{cloudCode:code},
			headers:{
				"X-Application-Id":"admin",
				"X-Session-Token":"test"
			}
		}).then(function(doc){
			expect(doc.updatedAt).toBeDefined()
			return $.ajax({
				type:'get',
				url:host+"/apps/"+appId,
				headers:{
					"X-Application-Id":"admin",
					"X-Session-Token":"test"
				}
			}).then(function(doc){
				expect(doc.cloudCode).toBe(code)
			},done)
		},done)
	}
	
		
	describe("of collections",function(){
		it("can inject code before creating document",function(done){
			changeCloudCode(done,function(Cloud){
				Cloud.beforeCreate('books', function(req, res){
					res.success(req)
				})
			}).then(function(){
				$.ajax({url: root, type:'post',data:{name:"a"}})
					.then(function(m){
						expect(m.user).toBeDefined()
						expect(m.user._id).toBe('test')
						expect(m.object).toBeDefined()
						expect(m.object.name).toBe('a')
						done()
					},done)
			},done)
		})
		
		it("can inject code after creating document",function(done){
			changeCloudCode(done,function(Cloud){
				Cloud.afterCreate('books', function(req, res){
					res.success(req)
				})
			}).then(function(){
				$.ajax({url: root, type:'post',data:{name:"a"}})
					.then(function(m){
						expect(m.user).toBeDefined()
						expect(m.user._id).toBe('test')
						expect(m.object).toBeDefined()
						expect(m.object.name).toBe('a')
						expect(m.object._id).toBeDefined()
						expect(m.object.updatedAt).toBeDefined()
						done()
					},done)
			},done)
		})
		
		it("can inject code before updating document",function(done){
			changeCloudCode(done,function(Cloud){
				Cloud.beforeUpdate('books', function(req, res){
					res.success(req)
				})
			}).then(function(){
				$.ajax({url: root+"/book1", type:'patch',data:{name:"a"}})
					.then(function(m){
						expect(m.user).toBeDefined()
						expect(m.user._id).toBe('test')
						
						expect(m.object).toBeDefined()
						expect(m.object['$set'].name).toBe('a')
						
						expect(m.old).toBeDefined()
						expect(m.old._id).toBe('book1')
						done()
					},done)
			},done)
		})
		
		it("can inject code after updating document",function(done){
			changeCloudCode(done,function(Cloud){
				Cloud.afterUpdate('books', function(req, res){
					res.success(req)
				})
			}).then(function(){
				$.ajax({url: root+"/book2", type:'patch',data:{name:"goodbook"}})
					.then(function(m){
						expect(m.user).toBeDefined()
						expect(m.user._id).toBe('test')

						expect(m.object).toBeDefined()
						expect(m.object._id).toBe('book2')
						expect(m.object.name).toBe('goodbook')
						
						expect(m.old).toBeUndefined()
						done()
					},done)
			},done)
		})
		it("can inject code before deleting document",function(done){
			changeCloudCode(done,function(Cloud){
				Cloud.beforeRemove('books', function(req, res){
					res.success(req)
				})
			}).then(function(){
				$.ajax({url: root+"/book3", type:'delete'})
					.then(function(m){
						expect(m.user).toBeDefined()
						expect(m.user._id).toBe('test')
						
						expect(m.object).toBeDefined()
						expect(m.object._id).toBe('book3')
						expect(m.object.name).toBeDefined()
						done()
					},done)
			},done)
		})
		
		it("can inject code after deleting document",function(done){
			changeCloudCode(done,function(Cloud){
				Cloud.afterRemove('books', function(req, res){
					res.success(req)
				})
			}).then(function(){
				$.ajax({url: root+"/book4", type:'delete'})
					.then(function(m){
						expect(m.user).toBeDefined()
						expect(m.user._id).toBe('test')
						
						expect(m.object).toBeDefined()
						expect(m.object._id).toBe('book4')
						expect(m.object.name).toBeDefined()
					},done)
					.then(function(){
						$.get(root+"/book4",{error:null})
						.then(function(doc){
							$.fail()
							done()
						},function(error){
							expect(error).toBe('Not exists')
							done()
						})
					},done)
			},done)
		})
		
		it("return error directly",function(done){
			changeCloudCode(done,function(Cloud){
				Cloud.beforeCreate('books', function(req, res){
					res.error("error from cloud")
				})
			}).then(function(){
				$.ajax({url: root, type:'post',data:{name:"a"},error:null})
					.then(function(m){
						$.fail()
						done()
					},function(error){
						expect(error).toBe("error from cloud")
						done()
					})
			},done)
		})
	})
	
	describe("of rest functions", function(){
		it("can create", function(done){
			changeCloudCode(done,function(Cloud){
				Cloud.define('test', function(req, res){
					res.success(req)
				})
			}).then(function(){
				$.post(host+"/functions/test",{data:{hello:1}})
				.then(function(m){
					expect(m.user).toBeDefined()
					expect(m.user._id).toBe('test')
					expect(m.params).toBeDefined()
					expect(m.params.hello).toBe(1)
					done()
				},done)
			},done)		
		})
	})
	
	describe("context seperation:root,global,native object", function(){
		it("can NOT change other application's context", function(done){
			promise.allOrNone([
				changeCloudCode(done,function(Cloud){//change on Test app
					Array.prototype.indexOf=function(){return 10}
					Cloud.define('test',function(req, res){
						res.success({array:[1,3,5,2].indexOf(2)})
					})
				}),
				changeCloudCode(done,function(Cloud){//change on Test1 app
					Cloud.define('test',function(req, res){
						res.success({array:[1,3,5,2].indexOf(2)})
					})
				},null,'test1')
				]).then(function(){
					promise.allOrNone([
						$.get(host+"/functions/test"),
						$.get(host+"/functions/test",{headers:{"X-Application-Id":"test1"}})
					]).then(function(results){
						expect(results.length).toBe(2)
						expect(results[0].array).toBe(10)
						expect(results[1].array).toBe(3)
						done()
					},done)
				},done)
		})
		describe("Safe VM", function(){
			it("error in code", function(done){
				changeCloudCode(done,function(Cloud){
					Cloud.define('test',function(req, res){
						a.b=1
						res.success("good")
					})
				}).then(function(){
					$.get(host+"/functions/test",{error:null})
					.then(function(m){
						$.fail()
						done()
					},function(error){
						try{
							a.b=1
						}catch(e){
							expect(error).toBe(e.message)	
						}
						done()
					})
				},done)
			})
			
			it("can NOT shutdown vm", function(done){
				changeCloudCode(done,function(Cloud){
					Cloud.define('test',function(req, res){
						root.process.exit()
						res.success("good")
					})
				}).then(function(){
					$.get(host+"/functions/test",{error:null})
					.then(function(m){
						$.fail()
						done()
					},function(error){
						expect(error).toBeTruthy()
						done()
					})
				},done)
			})
			
			it("should timeout for long time execution", function(done){
				changeCloudCode(done,function(Cloud){
					Cloud.define('test',function(req, res){
						var now=Date.now()
						while(Date.now()<now+500);
						res.success("good")
					})
				}).then(function(){
					$.get(host+"/functions/test",{error:null})
					.then(function(m){
						$.fail()
						done()
					},function(error){
						expect(error).toBeTruthy()
						done()
					})
				},done)
			},1000)
		})
	})
	
	describe("shared modules", function(){
		_.each("underscore,backbone,ajax,node-promise".split(","), function(module){
			describe(module, function(){
				it("require", function(done){
					changeCloudCode(done,function(Cloud,module){
						Cloud.define('test',function(req, res){
							res.success({required:require(module)&&true})
						})
					},module).then(function(){
						$.get(host+"/functions/test")
						.then(function(m){
							expect(m.required).toBe(true)
							done()
						},done)
					},done)
				})
				
				describe("seperation", function(){
					it("application level", function(done){
						promise.allOrNone([
							changeCloudCode(done,function(Cloud,module){//change on Test app
								var m=require(module);
								m.imchanged=true
								Cloud.define('test',function(req, res){
									res.success({imchanged:m.imchanged})
								})
							},module),
							changeCloudCode(done,function(Cloud,module){//change on Test1 app
								var m=require(module);
								Cloud.define('test',function(req, res){
									res.success({imchanged:m.imchanged||false})
								})
							},module,'test1')
							]).then(function(){
								promise.allOrNone([
									$.get(host+"/functions/test"),
									$.get(host+"/functions/test",{headers:{"X-Application-Id":"test1"}})
								]).then(function(results){
									expect(results.length).toBe(2)
									expect(results[0].imchanged).toBe(true)
									expect(results[1].imchanged).toBe(false)
									done()
								},done)
							},done)
					})
				})
			})	
		})
	})
	
	describe("server side require('ajax')", function(){
		it("restore application Test database",function(done){
			$.reset4All(host)
			.then(function(){
				$.get(root+"/reset4Test")
				.then(function(result){
						expect(result.ok).toBe(1)
						done()
					},done)
			},done)
		})
		
		it("not exists get with id return error", function(done){
				changeCloudCode(done,function(Cloud,root){
					var $=require('ajax')
					Cloud.define('test',function(req, res){
						$.get(root+"/booknoexist")
						.then(res.success,res.error)
					})
				},root).then(function(){
					$.get(host+"/functions/test",{error:null})
					.then(function(data){
						$.fail()
						done()
					},function(error){
						expect(error).toBe('Not exists')
						done()
					})
				},done)
			})
		
		describe("query with GET", function(){
			it(":id",function(done){
				changeCloudCode(done,function(Cloud,root){
					var $=require('ajax')
					Cloud.define('test',function(req, res){
						$.get(root+"/book1")
						.then(res.success,res.error)
					})
				},root).then(function(){
					$.get(host+"/functions/test")
					.then(function(data){
						expect(data._id).toBe('book1')
						done()
					},done)
				},done)
			})
			
			
			
			it("[all]", function(done){
				changeCloudCode(done,function(Cloud,root){
					var $=require('ajax')
					Cloud.define('test',function(req, res){
						$.get(root)
						.then(res.success,res.error)
					})
				},root).then(function(){
					$.get(host+"/functions/test")
					.then(function(data){
						expect(data.results).toBeDefined()
						expect(data.results.length).toBe(10)
						done()
					},done)
				},done)
			})
			
			it('?query={name:"raymond"}', function(done){
				changeCloudCode(done,function(Cloud,root){
					var $=require('ajax')
					Cloud.define('test',function(req, res){
						$.get(root+"?query="+JSON.stringify({name:'book0'}))
						.then(res.success,res.error)
					})
				},root).then(function(){
					$.get(host+"/functions/test")
					.then(function(data){
						expect(data.results).toBeDefined()
						expect(data.results.length).toBe(4)
						_.each(data.results,function(book){
							expect(book.name).toBe('book0')		
						})
						done()
					},done)
				},done)
			})

			it("?limit=n", function(done){
				var name='book0'
				changeCloudCode(done,function(Cloud,root){
					var $=require('ajax')
					Cloud.define('test',function(req, res){
						$.get(root+"?limit=2&query="+JSON.stringify({name:'book0'}))
						.then(res.success,res.error)
					})
				},root).then(function(){
					$.get(host+"/functions/test")
					.then(function(data){
						expect(data.results).toBeDefined()
						expect(data.results.length).toBe(2)
						_.each(data.results,function(book){
							expect(book.name).toBe(name)		
						})
						done()
					},done)
				},done)
			})
			
			it("direct doc recturned from ?limit=1", function(done){
				var name='book0'
				changeCloudCode(done,function(Cloud,root){
					var $=require('ajax')
					Cloud.define('test',function(req, res){
						$.get(root+"?limit=1&query="+JSON.stringify({name:'book0'}))
						.then(res.success,res.error)
					})
				},root).then(function(){
					$.get(host+"/functions/test")
					.then(function(data){
						expect(data.name).toBe(name)
						done()
					},done)
				},done)
			})
			
			it("?skip=n", function(done){
				var name='book0'
				changeCloudCode(done,function(Cloud,root){
					var $=require('ajax')
					Cloud.define('test',function(req, res){
						$.get(root+"?skip=3&query="+JSON.stringify({name:'book0'}))
						.then(res.success,res.error)
					})
				},root).then(function(){
					$.get(host+"/functions/test")
					.then(function(data){
						expect(data.results).toBeDefined()
						expect(data.results.length).toBe(1)
						_.each(data.results,function(book){
							expect(book.name).toBe(name)		
						})
						done()
					},done)
				},done)
			})
			
			it("?sort={name:1}", function(done){
				changeCloudCode(done,function(Cloud,root){
					var $=require('ajax')
					Cloud.define('test',function(req, res){
						$.get(root+"?limit=2&skip=7&sort="+JSON.stringify({name:1}))
						.then(res.success,res.error)
					})
				},root).then(function(){
					$.get(host+"/functions/test")
					.then(function(data){
						expect(data.results).toBeDefined()
						expect(data.results.length).toBe(2)
						expect(data.results[0].name).toBe("book7")
						expect(data.results[1].name).toBe("book8")
						done()
					},done)
				},done)
			})
			
			it("?sort={name:-1}", function(done){
				changeCloudCode(done,function(Cloud,root){
					var $=require('ajax')
					Cloud.define('test',function(req, res){
						$.get(root+"?limit=2&sort="+JSON.stringify({name:-1}))
						.then(res.success,res.error)
					})
				},root).then(function(){
					$.get(host+"/functions/test")
					.then(function(data){
						expect(data.results).toBeDefined()
						expect(data.results.length).toBe(2)
						expect(data.results[0].name).toBe("book9")
						expect(data.results[1].name).toBe("book8")
						done()
					},done)
				},done)
			})
			
			it("?fields={name:1}", function(done){
				changeCloudCode(done,function(Cloud,root){
					var $=require('ajax')
					Cloud.define('test',function(req, res){
						$.get(root+"/book1?fields="+JSON.stringify({name:1}))
						.then(res.success,res.error)
					})
				},root).then(function(){
					$.get(host+"/functions/test")
					.then(function(doc){
						expect(doc.name).toBeDefined()
						done()
					},done)
				},done)
			})
			
			it("?fields={name:0}", function(done){
				changeCloudCode(done,function(Cloud,root){
					var $=require('ajax')
					Cloud.define('test',function(req, res){
						$.get(root+"/book1?fields="+JSON.stringify({name:0}))
						.then(res.success,res.error)
					})
				},root).then(function(){
					$.get(host+"/functions/test")
					.then(function(doc){
						expect(doc.name).toBeUndefined()
						done()
					},done)
				},done)
			})
		})
		
		describe("create with POST" ,function(){
			it("with _id", function(done){
				var id='a book created with _id';
				changeCloudCode(done,function(Cloud,root){
					var $=require('ajax')
					Cloud.define('test',function(req, res){
						var id='a book created with _id'
						$.ajax({type:'post',url:root,data:{_id:id}})
						.then(res.success,res.error)
					})
				},root).then(function(){
					$.get(host+"/functions/test")
					.then(function(data){
						expect(data._id).toBe(id)
						done()
					},done)
				},done)
				
			})
			
			it("without _id", function(done){
				var name='a book created without _id'
				changeCloudCode(done,function(Cloud,root){
					var $=require('ajax')
					Cloud.define('test',function(req, res){
						var name='a book created without _id'
						$.ajax({type:'post',url:root,data:{name:name}})
						.then(res.success,res.error)
					})
				},root).then(function(){
					$.get(host+"/functions/test")
					.then(function(data){
						expect(data._id).toBeTruthy()
						done()
					},done)
				},done)
			})
		})
		
		describe('update with PUT/PATCH', function(){
			it("replace update with PUT", function(done){
				changeCloudCode(done,function(Cloud,root){
					var $=require('ajax')
					Cloud.define('test',function(req, res){
						$.ajax({
							type:'put',
							url:root+"/book1",
							data:{author:'raymond'}
						})
						.then(res.success,res.error)
					})
				},root).then(function(){
					$.get(host+"/functions/test")
					.then(function(data){
						expect(data.updatedAt).toBeTruthy()
						return $.get(root+"/book1")
							.then(function(doc){
								expect(doc.name).toBeUndefined()
								expect(doc.author).toBe('raymond')
								done()
							},done)
						done()
					},done)
				},done)
			})
			
			it("patch update with PATCH", function(done){
				changeCloudCode(done,function(Cloud,root){
					var $=require('ajax')
					Cloud.define('test',function(req, res){
						$.ajax({
							type:'patch',
							url:root+"/book2",
							data:{author:'raymond'}
						})
						.then(res.success,res.error)
					})
				},root).then(function(){
					$.get(host+"/functions/test")
					.then(function(data){
						expect(data.updatedAt).toBeTruthy()
						return $.get(root+"/book2")
							.then(function(doc){
								expect(doc.name).toBeDefined()
								expect(doc.author).toBe('raymond')
								done()
							},done)
						done()
					},done)
				},done)
			})
		})
		
		it("delete with DELETE", function(done){
			changeCloudCode(done,function(Cloud,root){
				var $=require('ajax')
				Cloud.define('test',function(req, res){
					$.ajax({
						type:'delete',
						url:root+"/book0"
					})
					.then(res.success,res.error)
				})
			},root).then(function(){
				$.get(host+"/functions/test")
				.then(function(data){
					expect(data).toBeTruthy()
					done()
				},done)
			},done)
		})
		
	})
	
	describe("backbone in server side", function(){
		it("restore application Test database",function(done){
			$.reset4All(host)
			.then(function(){
				$.get(root+"/reset4Test")
				.then(function(result){
						expect(result.ok).toBe(1)
						done()
					},done)
			},done)
		})
		
		it("get",function(done){
			changeCloudCode(done,function(Cloud,root){
				var backbone=require('backbone'),
					Book=backbone.Model.extend({urlRoot:root,idAttribute:'_id'});
				Cloud.define('test',function(req, res){
					(new Book({_id:'book1'}))
					.fetch()
					.then(res.success,res.error)
				})
			},root).then(function(){
				$.get(host+"/functions/test")
				.then(function(data){
					expect(data._id).toBe('book1')
					expect(data.name).toBe('book0')
					done()
				},done)
			},done)
		})
		
		it("create",function(done){
			changeCloudCode(done,function(Cloud,root){
				var backbone=require('backbone'),
					Book=backbone.Model.extend({urlRoot:root,idAttribute:'_id'});
				Cloud.define('test',function(req, res){
					(new Book({name:'a book created with _id'}))
					.save()
					.then(res.success,res.error)
				})
			},root).then(function(){
				$.get(host+"/functions/test")
				.then(function(data){
					expect(data._id).toBeDefined()
					expect(data.updatedAt).toBeDefined()
					$.get(root+"/"+data._id)
						.then(function(doc){
							expect(doc.name).toBe('a book created with _id')
							done()
						},done)
				},done)
			},done)
		})
		
		it("put update",function(done){
			changeCloudCode(done,function(Cloud,root){
				var backbone=require('backbone'),
					Book=backbone.Model.extend({urlRoot:root,idAttribute:'_id'});
				Cloud.define('test',function(req, res){
					(new Book({_id:'book1',author:'raymond'}))
					.save()
					.then(res.success,res.error)
				})
			},root).then(function(){
				$.get(host+"/functions/test")
				.then(function(data){
					expect(data.updatedAt).toBeDefined()
					$.get(root+"/book1")
						.then(function(doc){
							expect(doc.name).toBeUndefined()
							expect(doc.author).toBe('raymond')
							done()
						},done)
				},done)
			},done)
		})
		
		it("patch update",function(done){
			changeCloudCode(done,function(Cloud,root){
				var backbone=require('backbone'),
					Book=backbone.Model.extend({urlRoot:root,idAttribute:'_id'});
				Cloud.define('test',function(req, res){
					(new Book({_id:'book2'}))
					.save({author:'raymond'},{patch:true})
					.then(res.success,res.error)
				})
			},root).then(function(){
				$.get(host+"/functions/test")
				.then(function(data){
					expect(data.updatedAt).toBeDefined()
					$.get(root+"/book2")
						.then(function(doc){
							expect(doc.name).toBeDefined()
							expect(doc.author).toBe('raymond')
							done()
						},done)
				},done)
			},done)
		})
		
		it("destroy",function(done){
			changeCloudCode(done,function(Cloud,root){
				var backbone=require('backbone'),
					Book=backbone.Model.extend({urlRoot:root,idAttribute:'_id'});
				Cloud.define('test',function(req, res){
					(new Book({_id:'book0'}))
					.destroy({wait:true})
					.then(res.success,res.error)
				})
			},root).then(function(){
				$.get(host+"/functions/test")
				.then(function(data){
					$.get(root+"/book0",{error:null})
						.then(function(doc){
							$.fail()
							done()
						},function(error){
							expect(error).toBe('Not exists')
							done()
						})
				},done)
			},done)
		})
	})
})