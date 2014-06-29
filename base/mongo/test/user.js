describe("User service", function(){
	var host="http://127.0.0.1",
		root=host+"/users";
	
	jQuery.ajaxSetup({
		async:false,
		dataType:"json",
		headers:{
			"X-Application-Id":"test",
			"X-Session-Token":"test"
		},
		error: function(){
			expect(false).toBe(true)
		}
	})
	
	it("restore Test database",function(){
		jQuery.get(root+"/reset")
			.done(function(result){
				expect(result.ok).toBe(1)
			})
	})
	
	describe("Account Functions", function(){
		it("signup", function(){
			jQuery.ajax({
				type:"post",
				url: root, 
				data:{username:"lalalic",password:"aa619916",email:"lalalic@139.com"}
			}).done(function(user){
				expect(user.sessionKey).toBeTruthy()
				expect(user.username).toBe("lalalic")
				expect(!user.password).toBeTruthy()
			})
		})
		
		it("login", function(){
			jQuery.get(host+"/login?username=lalalic&password=aa619916")
				.done(function(user){
					expect(user.sessionKey).toBeTruthy()
					expect(user.username).toBe("lalalic")
					expect(!user.password).toBeTruthy()
				})
		})
		
		it("logout", function(){
			
		})
		
		it("restore session without signin", function(){
			jQuery.get(host+"/me")
				.done(function(user){
					expect(user.sessionKey).toBeTruthy()
					expect(user.username).toBe("lalalic")
					expect(!user.password).toBeTruthy()
				})
		})
	})
	
	it("change password", function(){
		jQuery.ajax({
			type:"post",
			url: host+"/changepassword",
			data:{old:"123456",password:"aa"}
		}).then(function(user){
			expect(user.updatedAt).toBeTruthy()
		})
	})
	
	it("be assigned as a role", function(){
		
	})
})