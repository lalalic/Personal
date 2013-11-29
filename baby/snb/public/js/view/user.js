define(['view/base','app'],function(View,app){
	var Page=View.Page
	return new (Page.extend({
		title:'SNB Account',
		cmds:'<a><button type="submit"><span class="icon ok-sign"/></button></a>',
		events:_.extend({},Page.prototype.events,{
			'submit form#signin':'signin',
			'submit form#signup':'signup',
			'submit form#password':'password',
			'click nav .signin': function(){this.show('signin')},
			'click nav .signup': function(){this.show('signup')},
			'click nav .password': function(){this.show('password')}
		}),
		initialize:function(){
			this.content=$('#tmplUser').html(),
			Page.prototype.initialize.apply(this,arguments)
			this.$('header')
				.after('<nav data-control="groupbar">\
					<a class="signin">Sign In</a>\
					<a class="signup">Sign Up</a>\
					<a class="password">Forget Password</a>\
					</nav>');
			var me=this
			this.$('form').submit(function(){
				me[this.id]()	
				return false;
			})
		},
		show:function(a){
			this.$('form').hide()
				.filter('form#'+a).show()
			this.$('nav[data-control=groupbar]>a').removeClass('active')
				.filter('.'+a+'').addClass('active')
			this.$('footer button[type=submit]').attr('form',a)
			return Page.prototype.show.apply(this,arguments)
		},
		signin: function(){
			try{
				var f=this.$('form#signin').get(0),
					user=new Parse.User({username:f.username.value,password:f.password.value})
				user.logIn().then(_.bind(this.reload,this))
			}catch(e){
				console.error(e)
			}
			return false
		},
		signup: function(){
			try{
				var f=this.$('form#signup').get(0),me=this,
					user=new Parse.User({username:f.username.value,password:f.password.value})
				user.signUp().then(function(){
					me.navigate('#child',{trigger:true,replace:true})
				})
			}catch(e){
				console.error(e)
			}
			return false
		},
		password: function(){
			Parse.User.requestPasswordReset(this.$('form#signup').get(0).email.value)
			return false
		}
	}))
})