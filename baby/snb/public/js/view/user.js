define(['view/base','app'],function(View,app){
	var Page=View.Page,next
	return new (Page.extend({
		title:'SNB Account',
		cmds:'<a><button type="submit"><span class="icon ok-sign"/></button></a>',
		events:_.extend({},Page.prototype.events,{
			'submit form#signin':'signin',
			'submit form#signup':'signup',
			'submit form#password':'password'
		}),
		initialize:function(){
			this.content=$('#tmplUser').html(),
			Page.prototype.initialize.apply(this,arguments)
			this.$('header')
				.after('<nav data-control="groupbar">\
					<a href="#user/signin">Sign In</a>\
					<a href="#user/signup">Sign Up</a>\
					<a href="#user/password">Forget Password</a>\
					</nav>');
			var me=this
			this.$('form').submit(function(){
				me[this.id]()	
				return false;
			})
		},
		show:function(a, then){
			this.$('form').hide()
				.filter('form#'+a).show()
			this.$('nav[data-control=groupbar]>a').removeClass('active')
				.filter('[href$='+a+']').addClass('active')
			this.$('footer button[type=submit]').attr('form',a)
			next=then
			return Page.prototype.show.apply(this,arguments)
		},
		signin: function(){
			try{
				var f=this.$('form#signin').get(0),me=this,
					user=new Parse.User({username:f.username.value,password:f.password.value})
				user.logIn()
					.then(function(){
						Promise.when(app.init4User(Parse.User.current()))
						.then(function(){
							if(me.isUserURL())
								me.reload()
							else
								me.back()
						})
					})
			}catch(e){
				console.error(e)
			}
			return false
		},
		signup: function(){
			try{
				var f=this.$('form#signup').get(0),me=this,
					user=new Parse.User({username:f.username.value,password:f.password.value})
				user.signUp()
					.then(function(){
						if(me.isUserURL())
							me.navigate('#child',{trigger:true,replace:true})
						else
							me.reload()
					})
			}catch(e){
				console.error(e)
			}
			return false
		},
		password: function(){
			Parse.User.requestPasswordReset(this.$('form#signup').get(0).email.value)
			return false
		},
		isUserURL:function(){
			return location.hash.indexOf('#user/')===0
		}
	}))
})