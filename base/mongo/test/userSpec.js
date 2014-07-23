describe("1/users", function(){
	var host="http://127.0.0.1/1",
		root=host+"/users",	
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
			"X-Application-Id":"test",
			"X-Session-Token":"test"
		},
		error: function(error){
			expect(error).toBe(null)
		}
	})
	
	it("restore Test database",function(done){
		$.get(root+"/reset4Test")
			.then(function(result){
				expect(result.ok).toBe(1)
				expect(result.n).toBe(1)
				done()
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
		
		it("get /me with header 'X-Session-Token' of signedIn user to restore session without signin", function(done){
			$.get(root+"/me",{headers:{'X-Session-Token':'test'}})
				.then(function(user){
					expect(user.sessionToken).toBeDefined()
					expect(user.username).toBe("test")
					expect(user.password).toBeUndefined()
					done()
				},done)
		})
		
		it("get /me with header 'X-Session-Token' of not signedIn user to restore session without signin", function(done){
			$.get(root+"/me",{headers:{'X-Session-Token':'test54'},error: function(error){
					expect(error).toBe("Invalid Session")
					done()
				}})
				.then(function(user){
					expect(user).toBe(0)
					done()
				})
		})
	})
	
	it("/requestPasswordReset", function(done){
		$.ajax({
			type:"post",
			url: host+"/requestPasswordReset",
			data:{old:"123456",password:"aa"},
			error: function(error){
				expect(error).toBe("Not support yet")
				done()
			}
		}).then(function(user){
			expect(1).toBe(0)
			done()
		})
	})
})