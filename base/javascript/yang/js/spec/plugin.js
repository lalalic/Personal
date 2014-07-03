define(['jasmine',"Plugin"],function(jasmine,Plugin){
	describe("Plugin",function(){
		var plugins=[]
		it("is extendible",function(){
			
		})
		
		it("able to be loaded from local file", function(){
			//plugin.type="local file"
			//plugins.push(plugin)
		})
		
		it("able to be loaded from http context", function(){
			//pugin.type="http context"
			//plugins.push(plugin)
		})
		
		it("able to be loaded from remote zip content", function(){
			//plugin.type="zip"
			//plugins.push(plugin)
		})
		
		describe("Plugin from zip", function(){
			it("can be parsed",function(){
			
			})
			
			it("can be saved to local file system of browser",function(){
			
			})		
		})
		
		_.each(plugins,function(plugin){
			describe("Plugin of "+plugin.type,function(){
				it("can give basic information",function(){
				
				})
				
				it("can load modules within it", function(){
				
				})
				
				it("can load i18n bundles", function(){
				
				})
				
				it("can load css style bundles", function(){
				
				})
				
				it("can load font bundles", function(){
				
				})
				
				it("can load any other bundles", function(){
				
				})
			})
		})
		
		describe("Plugin module itself",function(){
			it("can collect all loaded plugins", function(){
			
			})
		})
		
		it("cleanup",function(){
			//remove all loaded plugins
		})
	})
})