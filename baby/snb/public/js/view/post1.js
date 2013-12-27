define(['view/base','app'],function(View, app){
	$('body').append('<style>\
		#show img{margin-left: auto;margin-right:auto;display:block;width:80%}\
		#taskOption{padding:5px; line-height:3em;cursor:default;list-style:none}\
		.favorited,.tasked{color:yellow}\
		.stat{position:relative;height:300px;background-color:black}\
		</style>')
	var Page=View.Page, 
		Post=app.Post, Favorite=app.Favorite, Task=app.Task, Child=app.Child, Story=app.Story
	return new (Page.extend({
		cmds:'<a href="#story"><span title="'+text("tell your baby's story")+'" class="icon story"/></a>\
			<a href="#comments"><span title="'+text("comment")+'" class="icon comment"/></a>\
			<a><span title="'+text("favorite")+'" class="icon star"/></a>\
			<a><span title="'+text("plan for baby")+'" class="icon calendar"/></a>',
		events:_.extend({},Page.prototype.events,{
			'click span.star':'toggleFavorite',
			'click span.calendar':'showTaskOption',
			'click #taskOption input':'addTask'
		}),
		initialize: function(){
			Page.prototype.initialize.apply(this,arguments)
			this.content=_.template('#tmplPost')
			this.tmplStory=_.template('#tmplStory')
			this.$('article').attr('id','show')
			this.$el.append('<div id="taskOption" class="popup hidden"/>')
			this.taskOption=this.$('#taskOption')
			var options=$('<span class="checkable vertical open"><span/></>').appendTo(this.taskOption)
			_.each("Today,Tomorrow,This week, This month, This year".split(','),function(name,i){
				this.append('<input type="radio" name="_to" value="'+(i+1)+'" class="outview"><span onclick="$(this).prev().click()">'+name+'</span>')
			},options)
			options.append('<input type="radio" name="_to" value="0" class="outview" checked><span onclick="$(this).prev().click()">No Plan</span>')
		},
		show: function(id){
			if(_.isObject(id)){
				this.model=id
				this.render()
			}else{
				var me=this
				this.model=new Post
				this.model.id=id
				this.model.fetch().then(function(){me.render()})
			}
			if(this.model!=null){
				var stories=new Parse.Query(Story).equalTo('post',id)
				stories.find().then(function(stories){
					me.rendStories(stories)
				})
			}
			return Page.prototype.show.apply(this,arguments)
		},
		render: function(){
			var me=this
			this.$('article').empty().append(this.content(this.model))
			this.setTitle(this.model.get('title'))
			this._favorite(function(f){
				f&&f.get('status')&&me.$('a span.star').addClass('favorited')
			})
			this._task(function(f){
				if(f){
					me.$('a span.calendar').addClass('tasked')
					me.taskOption.find('input[value="'+f.get('type')+'"]').click()
				}
			})
			this.$('footer span.comment').parent().attr('href','#comments/'+this.model.id)
			this.$('footer span.story').parent().attr('href','#story/'+this.model.id)
			return this
		},
		rendStories: function(stories){
			var me=this
			_.each(stories, function(story){
				this.append(me.tmplStory(story))
			},this.$('#stories'))
		},
		toggleFavorite:function(){
			var me=this
			this._favorite(function(f){
					f=f||new Favorite({post:me.model.id,title:me.model.get('title'),thumbnail:me.model.get('thumbnail')})
					f.set('status',f.get('status')?0:1)
					f.save()
						.then(function(){
							me.$('a span.star')[(f.get('status')?'add':'remove')+'Class']('favorited')
						})
				})
		},
		showTaskOption:function(e){
			this.popup(thsi.taskOption,e)
		},
		_favorite: function(f){
			if(Parse.User.current())
			new Parse.Query(Favorite)
				.equalTo('author',Parse.User.current().id)
				.equalTo('post',this.model.id)
				.first()
				.then(f);
		},
		_task: function(f){
			if(Parse.User.current())
			new Parse.Query(Task)
				.equalTo('author',Parse.User.current().id)
				.equalTo('post',this.model.id)
				.equalTo('child',Child.current.id)
				.first()
				.then(f)
		},
		addTask: function(ev){
			var e=ev.srcElement, me=this,
				type=parseInt(e.value)
			if(e.checked){
				this._task(function(f){
					switch(type){
					case 0:
						f && f.destroy() && me.$('a span.calendar').removeClass('tasked')
						break
					default:
						f=f||new Task({post:me.model.id,title:me.model.get('title'),
							thumbnail:me.model.get('thumbnail'),status:1,
							child:Child.current.id})
						f.set('type',type)
						f.save()
							.then(function(){
								me.$('a span.calendar').addClass('tasked')
							})
					}
				})
			}
		},
		clear: function(){
			this.$('a span.calendar').removeClass('tasked')
			this.$('a span.star').removeClass('favorited')
			this.taskOption.find('input[value="0"]').click()
			return Page.prototype.clear.apply(this,arguments)
		}
	}))
})