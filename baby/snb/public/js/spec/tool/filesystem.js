define(['tool/filesystem'],function(filesystem){
	describe('FileSystem',function(){
		it('Get FileSystem Instance',function(){
			asyncIt(filesystem.getInstance())
		})
		
		it('FileSystem Instance: PERSISTENT and 2M',function(){
			asyncIt(filesystem.getInstance(PERSISTENT,2*1024*1024))
		})
		
		it('FileSystem Instance: TEMPORARY and 2M',function(){
			asyncIt(filesystem.getInstance(TEMPORARY,2*1024*1024))
		})
		
		it('Create File',function(){
			asyncIt(filesystem.create("test.txt","hello"))
		})
		
		describe('file operation',function(){
			it('Get File',function(){
				
			})
			
			it('Delete File',function(){
				
			})
		})
	})
})