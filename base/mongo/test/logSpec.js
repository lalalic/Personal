describe("application log service should provide", function(){
	var host="http://127.0.0.1/1",
		root=host+"/classes/books",
		$=require('./ajax')(),
		_=require('underscore');
	
	it("restore Test database",function(done){
		$.reset4All(host).then(function(){
			done()
		},done)
	})
	
	describe("individual application level log, including ", function(){
		it("application runtime log", function(){
		})
		
		it("http access log", function(){
		
		})
		
		describe("query", function(){
			it("all logs", function(){
			
			})
			
			describe("by level", function(){
				it("access log", function(){
				
				})
				
				it("error log", function(){
				
				})
				
				it("warning log", function(){
				
				})
				
				it("info log", function(){
				
				})
			})
		})
		
		describe("log level on application", function(){
			it("set on application", function(){
			
			})
			
			it("access is lowest level, and always logged", function(){
			
			})
			
			it("only error logged", function(){
			
			})
		})
		
		it("support dump logs", function(){
		
		})
		
		it("clear all logs", function(){
		
		})
	})
})