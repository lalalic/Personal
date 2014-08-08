//File Service is based on Qiniu storage Cloud
/*
File Service works as business server to provide token to client, and make qiniu return {url} directly. The token should be expired in a few minutes.

*/
describe('File Service', function(){
	var host="http://127.0.0.1/1",
		root=host+"/files",
		$=require('./ajax')(),
		_=require('underscore'),
		qiniu=require('qiniu');
		
	it("restore Test database",function(done){
		$.reset4All(host).then(done,done)
	})
		
	it('works as business server to provide token to client, and make qiniu return {url} directly',function(done){
		$.get(root+"/token")
		.then(function(token){
			expect(token).toBeTruthy()
			var key="test/"+Date.now()
			qiniu.io.put(token,key,"test",null,function(error,response){
				if(error || response==null)
					$.fail(error)
				else
					expect(response.url).toMatch(new RegExp(key+"$"))
				done()
			})
			done()
		},done)
	},1000)
	
	it('The token should be expired in a few minutes', function(done){
		$.get(root+"/token?policy="+JSON.stringify({expires:1}))
		.then(function(token){
			expect(token).toBeTruthy()
			var now=Date.now()
			while(Date.now()<(now+1000));
			var key="test/"+Date.now()
			qiniu.io.put(token,key,"test",null,function(error,response){
				if(error)
					expect(error).toBetruthy();
				else
					$.fail()
				done()
			})
		},done)
	},2000)
})