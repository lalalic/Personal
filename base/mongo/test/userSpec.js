describe("user", function(){
	var host="http://127.0.0.1/1",
		root=host+"/users",	
		$=require('./ajax')(),
		_=require('underscore');
	
	it("restore Test database",function(done){
		$.reset4All(host).then(function(){
			$.get(root+"/reset4Test")
			.then(function(result){
				expect(result.ok).toBe(1)
				expect(result.n).toBe(1)
				done()
			},done)
		},done)
	})
	
	describe("Account service", function(){
		it("post to signup", function(done){
			$.ajax({
				type:"post",
				url: root, 
				data:{username:"test1",password:"test1",email:"test1@139.com"}
			}).then(function(user){
				expect(user.sessionToken).toBeDefined()
				expect(user.username).toBe("test1")
				expect(user.password).toBeUndefined()
				done()
			},done)
		})
		
		it("get /login", function(done){
			$.get(host+"/login?username=test&password=test0123")
				.then(function(user){
					expect(user.sessionToken).toBeDefined()
					expect(user.username).toBe("test")
					expect(user.password).toBeUndefined()
					done()
				},done)
		})
		
		it("get /me with header 'X-Session-Token' of signedIn user to restore session", function(done){
			$.get(root+"/me",{headers:{'X-Session-Token':'test'}})
				.then(function(user){
					expect(user.sessionToken).toBeDefined()
					expect(user.username).toBe("test")
					expect(user.password).toBeUndefined()
					done()
				},done)
		})
		
		it("get /me with header 'X-Session-Token' of not signedIn user to restore session", function(done){
			$.get(root+"/me",{headers:{'X-Session-Token':'test54'},error: null})
				.then(function(user){
					$.fail()
					done()
				},function(error){
					expect(error).toBe("Not exists")
					done()
				})
		})
	})
	
	it("/requestPasswordReset", function(done){
		$.ajax({
			type:"post",
			url: host+"/requestPasswordReset",
			data:{old:"123456",password:"aa"},
			error: null
		}).then(function(user){
			expect(1).toBe(0)
			done()
		}, function(error){
			expect(error).toBe("Not support yet")
			done()
		})
	})
})