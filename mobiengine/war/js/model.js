define(['app', 'jQuery','Underscore','Backbone'],function(app, $, _, Backbone){
	var User=app.User,
		currentApp, 
		prevApp,
		/**
		 *  @class
		 *  @memberof app
		 *  @augments app.Model
		 */
		Application=app.Application=app._app=app.Model.extend({
			className:'_app',
			urlRoot:'1/apps'
		},/** @lends app.Application */{
			/** 
			 * get current user 
			 * @returns {app.User} 
			 */
			current:function(m){
				switch(m){
				case undefined:
					if(currentApp!=null)
						return currentApp
					return (m=localStorage.getItem('currentApp')) && (m=Application.all.get(parseInt(m))) &&  this.current(m) || null
				case null:
					prevApp=currentApp
					localStorage.removeItem('currentApp')
					currentApp=null
					Application.all.trigger('current')
					return null
				default:
					currentApp=m
					localStorage.setItem('currentApp',m.id)
					Application.all.trigger('current',m)
					console.log('set current application')
					return m
				}
			},
			/**
			 *  restore to previous application when cancel create new application
			 */
			restoreCurrent:function(){
				this.current(prevApp)
			},
			/**
			 *  create Application Collection 
			 */
			collection:function(){
				if(!this.Collection){
					this.Collection=Backbone.Collection.extend({model:this})
					this.Collection.prototype.fetch=function(){
						if(User.current()==null){
							if(!this.isEmpty())
								this.reset()
							return $.Deferred().resolve();
						}
						return Backbone.Collection.prototype.fetch.apply(this,arguments)
					}
				}
				return new this.Collection()
			}
		});

	app.Schema.collection=function(){
		if(!this.Collection){
			this.Collection=Backbone.Collection.extend({model:this})
			this.Collection.prototype.fetch=function(){
				if(Application.current()==null){
					if(!this.isEmpty())
						this.reset()
					return $.Deferred().resolve();
				}
				return Backbone.Collection.prototype.fetch.apply(this,arguments)
			}
		}
		return new this.Collection()
	}
	
	var _init4User=app.init4User
	app.init4User=function(){
		return _init4User.apply(this,arguments)
			.then(function(){
				return Application.all.fetch()
					.then(function(){
						Application.current(Application.all.first())
					})
			})
	}
	
	var _init=app.init
	app.init=function(){
		this.Application.all=this.Application.collection()
		return _init.apply(this,arguments)
	}
})