describe("cloud", function(){
	var host="http://127.0.0.1/1",
		kind="books",
		root=host+"/classes/"+kind,
		$=require('./ajax')(),
		_=require('underscore');
	
	it("restore application Test database",function(done){
		$.reset4All(host)
		.then(function(){
			$.get(root+"/reset4Test",{headers:{
					"X-Application-Id":"test",
					"X-Session-Token":"test"
				}}).then(function(result){
					expect(result.ok).toBe(1)
					done()
				},done)
		},done)
	})	
	
	$.ajaxSetup({
		headers:{
			"X-Application-Id":"test",
			"X-Session-Token":"test"
		}
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
	
		
	xdescribe("of collections",function(){
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
						$.get(root+"/book4")
						.then(function(doc){
							expect(_.keys(doc).length).toBe(0)
							done()
						},done)
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
	
	xdescribe("of rest functions", function(){
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
	
	xdescribe("context seperation", function(){
		it("can NOT change global context", function(){})
		it("can NOT change other application's context", function(){})
		it("can NOT shutdown vm", function(){})
		it("should timeout for long time execution", function(){})
	})
	
	describe("shared modules", function(){
		_.each("underscore,backbone,ajax,node-promise".split(","), function(shared){
			describe(shared, function(){
				it("require", function(done){
					changeCloudCode(done,function(Cloud,request){
						var m=require(request);
						m.imchanged=true
						Cloud.define('test',function(req, res){
							res.success({imchanged:m.imchanged})
						})
					},shared).then(function(){
						$.post(host+"/functions/test",{data:{hello:1}})
						.then(function(m){
							expect(m.imchanged).toBe(true)
							done()
						},done)
					},done)
				})
				
				xdescribe("seperation on application level", function(){
					it("can NOT change "+module+" in other application context", function(){
					
					})
					it("can NOT change "+module+" in global context", function(){
					
					})
				})
			})	
		})
		
		xdescribe("server side ajax features", function(){
			it("support all entity specs", function(){})
			it("support all user specs", function(){})
		})
		
		
		xdescribe("backbone in server side", function(){
			it("support save",function(){
			})
			
			it("support update",function(){
			})
			
			it("support destroy",function(){
			})
			
			it("support get",function(){
			})
		})
	})
})