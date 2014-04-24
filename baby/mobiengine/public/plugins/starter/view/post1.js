/**
 *  Show Post
 *  @module Post1
 */
define(['UI','app'],function(UI, app){
	var Tag=app.Tag
	var tmplPost='\
		<div style="padding:10px">\
		<div style="min-height:50%">\
			<div>\
				<span class="tags"> {{getTags()}}</span>\
				<span class="on-right icon user"> {{get("authorName")}}</span>\
				<span class="on-right icon time"  style="padding-right:20px"> {{get("createdAt")}}</span>\
			</div>\
			<hr/>\
			<pre>{{get("content")}}</pre>\
		</div>\
		<ul class="list" id="stories"/>\
	</div>';
		
	var tmplStory='\
		<li>\
			<pre><span class="icon baby"/>{{get("childName")}}: {{get("content")}}</pre>\
		</li>';
	var Post=app.Post, 
		Favorite=app.Favorite, 
		Task=app.Task, 
		Child=app.Child, 
		Story=app.Story,
		User=app.User,
		Query=app.Query
	return new (UI.Page.extend({
		cmds:'<a href="#story"><span title="'+text("tell your baby's story")+'" class="icon story"/></a>\
			<a href="#comments"><span title="'+text("comment")+'" class="icon comment"/><span class="tag count"/></a>\
			<a><span title="'+text("favorite")+'" class="icon star"/></a>\
			<a><span title="'+text("plan for baby")+'" class="icon calendar"/></a>',
		events:_.extend({},UI.Page.prototype.events,{
			'click span.star':'toggleFavorite',
			'click span.calendar':'showTaskOption',
			'click #taskOption input':'addTask'
		}),
		render: function(){
			this._super().render.apply(this,arguments)
			this.content=_.template(tmplPost)
			this.tmplStory=_.template(tmplStory)
			this.$('article').attr('id','show')
			this.$el.append('<div id="taskOption" class="popup hidden"/>')
			this.taskOption=this.$('#taskOption')
			var options=$('<span class="checkable vertical open"><span/></>').appendTo(this.taskOption)
			_.each("Today,Tomorrow,This week, This month, This year".split(','),function(name,i){
				this.append('<input type="radio" name="_to" value="'+(i+1)+'" class="outview"><span onclick="$(this).prev().click()">'+text(name)+'</span>')
			},options)
			options.append('<input type="radio" name="_to" value="0" class="outview" checked><span onclick="$(this).prev().click()">'+text('No Plan')+'</span>')
			return this
		},
		show: function(id){
			if(_.isObject(id)){
				this.model=id
				this.renderPost()
			}else
				(this.model=new Post({id:id}))
					.fetch()
					.then(_.bind(function(){this.renderPost()},this))
					
			new Query(Story)
				.equalTo('post',id)
				.fetch()
				.then(_.bind(function(stories){
					var $storyList=this.$('#stories')
					_.each(stories, _.bind(function(story){
						$storyList.append(this.tmplStory(story))
					},this))
				},this))
			return this._super().show.apply(this,arguments)
		},
		renderPost: function(){
			this.$('article').empty()
				.append(this.content(this.model))
				
			this.setTitle(this.model.get('title'))
			
			this._favorite(_.bind(function(f){
				f&&f.get('status')&&this.$('a span.star').addClass('favorited')
			},this))
			
			this._task(_.bind(function(f){
				if(!f) return
				this.$('a span.calendar').addClass('tasked')
				this.taskOption.find('input[value="'+f.get('type')+'"]').click()
			},this))
			
			this.model.has('comments') && this.$('span.tag.count').text(this.model.get('comments'))
			this.$('footer span.comment').parent().attr('href','#comments/Post/'+this.model.id)
			this.$('footer span.story').parent().attr('href','#story/'+this.model.id)
			return this
		},
		toggleFavorite:function(){
			this._favorite(_.bind(function(f){
					f=f||new Favorite({
						post:this.model.id,
						title:this.model.get('title'),
						thumbnail:this.model.get('thumbnail')})
		
					f.set('status',f.get('status')?0:1)
					f.save()
						.then(_.bind(function(){
							this.$('a span.star')[(f.get('status')?'add':'remove')+'Class']('favorited')
						},this))
				},this))
		},
		showTaskOption:function(e){
			this.popup(this.taskOption,e)
		},
		_favorite: function(f){
			if(!User.current()) return
			new Query(Favorite)
				.equalTo('author',User.current().id)
				.equalTo('post',this.model.id)
				.first()
				.then(f)
		},
		_task: function(f){
			if(!User.current() || !Child.current()) return
			new Query(Task)
				.equalTo('author',User.current().id)
				.equalTo('post',this.model.id)
				.equalTo('child',Child.current().id)
				.first()
				.then(f)
		},
		addTask: function(ev){
			var e=ev.srcElement, type=parseInt(e.value)
			if(!e.checked) return
			this._task(_.bind(function(f){
				switch(type){
				case 0:
					f && f.destroy() && this.$('a span.calendar').removeClass('tasked')
					break
				default:
					f=f||new Task({
						post:this.model.id,
						title:this.model.get('title'),
						thumbnail:this.model.get('thumbnail'),
						status:1,
						child:Child.current().id})
					f.set('type',type)
					f.save()
						.then(_.bind(function(){
							this.$('a span.calendar').addClass('tasked')
						},this))
				}
			},this))
		},
		clear: function(){
			this.$('a span.calendar').removeClass('tasked')
			this.$('a span.star').removeClass('favorited')
			this.$('span.tag.count').empty()
			//this.taskOption.find('input[value="0"]').click()
			return this._super().clear.apply(this,arguments)
		}
	},{
		STYLE:"#show img{margin-left: auto;margin-right:auto;display:block;width:80%}\
			#taskOption{padding:5px; line-height:3em;cursor:default;list-style:none}\
			.favorited,.tasked{color:yellow}\
			.stat{position:relative;height:300px;background-color:black}"
	}))
})