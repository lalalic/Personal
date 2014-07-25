describe("cloud code", function(){
	var host="http://127.0.0.1/1",
		root=host+"/classes/books",
		$=require('./ajax'),
		_=require('underscore');
		
	describe("of collections",function(){
		it("can inject code before creating document",function(){})
		it("can inject code after creating document",function(){})
		it("can inject code before updating document",function(){})
		it("can inject code after updating document",function(){})
		it("can inject code before deleting document",function(){})
		it("can inject code after deleting document",function(){})
	})
	
	describe("of rest functions", function(){
		it("can create", function(){})
		it("can be requested", function(){})
	})
	
	describe("context seperation", function(){
		it("can NOT change global context", function(){})
		it("can NOT change other application's context", function(){})
		it("can NOT shutdown vm", function(){})
		it("should timeout for long time execution", function(){})
	})
	
	describe("cloud modules", function(){
		_.each("underscore,backbone,node-promise,ajax".split(","), function(module){
			describe("module: "+module, function(){
				it("support require "+module, function(){
			
				})
				
				describe("seperation on application level", function(){
					it("can change "+module+" in its own application context", function(){})
					it("can NOT change "+module+" in other application context", function(){})
					it("can NOT change "+module+" in global context", function(){})
				})
			})	
		})
		
		describe("server side ajax features", function(){
			it("support all entity specs", function(){})
			it("support all user specs", function(){})
		})
		
		
		describe("backbone in server side", function(){
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