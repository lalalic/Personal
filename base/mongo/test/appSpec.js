xdescribe("/apps", function(){
var host="http://127.0.0.1/1",
		root=host+"/apps",	
		$=require('./ajax'),
		_=require('underscore');
	
	console.inspect=function(o){
		console.info(require('util').inspect(o))
	}
	
	jasmine.getEnv().defaultTimeoutInterval = 250;
	
	$.ajaxSetup({
		async:false,
		dataType:"json",
		headers:{
			"X-Application-Id":"admin",
			"X-Session-Token":"test"
		},
		error: function(error){
			expect(error).toBe(null)
		}
	})
	
	xit("restore Test database",function(done){
		$.get(root+"/reset4Test")
			.then(function(result){
				expect(result.ok).toBe(1)
				expect(result.n).toBe(1)
				done()
			},done)
	})
	
	xdescribe("application", function(){
		it("data should be seperated", function(){})
	})
	
	xdescribe("user", function(){
		describe("create", function(){
			it("can create new application, and return application token", function(){
			
			})
			
			it("can't create application with same name", function(){
			
			})
			
			it("can't create application with empty name", function(){
			
			})
		})
					
		describe("update", function(){
			it("can update its own application", function(){
			
			})
			
			it("can NOT update other's application", function(){
			
			})
			
			it("can't update name/application token", function(){
			
			})
			
			it("can update cloud code", function(done){})
			
			it("should throw error when there's error in cloud code", function(done){})
		
		})

		describe("delete",function(){
			it("can be deleted with confirmation", function(){
			
			})
			
			it("can't be deleted without confirmation", function(){
			
			})
		})
		
		describe("query", function(){
			it("can get its own applictions", function(){})
			it("can NOT get others applictions by id", function(){})
			it("can NOT get others applictions by query", function(){})
		})
	})
})