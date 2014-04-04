/**
 * User model to provide signin, signup, and forget password function
 * @module User
 * @requires UI
 */
define(['UI','app'],function(View,app){
	var tmplUser='\
			<form id="signin">\
				<fieldset><input name="username" type="text" placeholder="'+text('user name')+'"></fieldset>\
				<fieldset><input name="password" type="password" placeholder="'+text('password')+'"></fieldset>\
			</form>\
			<form id="signup">\
				<fieldset><input name="username" type="text" placeholder="'+text('user name')+'"></fieldset>\
				<fieldset><input name="email" type="email" placeholder="'+text('email address where reset password will be sent')+'"></fieldset>\
				<fieldset><input name="password" type="text" placeholder="'+text('password')+'"></fieldset>\
			</form>\
			<form id="password">\
				<fieldset><input name="email" type="text" placeholder="'+text('email address where new password would send')+'"></fieldset>\
			</form>'
	var Page=View.Page, User=app.User

	return new (Page.extend({
		cmds:'<a><button type="submit"><span class="icon save"/></button></a>',
		content:tmplUser,
		events:_.extend({},Page.prototype.events,{
			'submit form#signin':'signin',
			'submit form#signup':'signup',
			'submit form#password':'password',
			'click nav .signin': function(){this.show('signin')},
			'click nav .signup': function(){this.show('signup')},
			'click nav .password': function(){this.show('password')}
		}),
		initialize:function(){
			this._super().initialize.apply(this,arguments)
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
			return this._super().show.apply(this,arguments)
		},
		signin: function(){
			var f=this.$('form#signin').get(0),
				user=new User({username:f.username.value,password:f.password.value})
			user.logIn().then(_.bind(this.reload,this))
			return false
		},
		signup: function(){
			var f=this.$('form#signup').get(0),
				user=new User({username:f.username.value,password:f.password.value})
			user.signUp().then(_.bind(this.reload,this))
			return false
		},
		password: function(){
			User.requestPasswordReset(this.$('form#signup').get(0).email.value)
			return false
		}
	}))
})