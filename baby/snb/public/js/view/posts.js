define(['view/base','app'],function(View,app){
	var ListPage=View.ListPage, Post=app.Post, Tag=app.Tag
	return new (ListPage.extend({
		itemTemplate:'#tmplPosts',
		cmds:'<a href="#create"><span class="icon plus"/></a><a><span class="icon search"/></a>',
		collection:new (Parse.Collection.extend({model:Post})),
		events: _.extend({},ListPage.prototype.events,{
			'click span.search':'showSearchWidget'
		}),
		initialize:function(){
			ListPage.prototype.initialize.apply(this,arguments)
			var t=_.template('#tmplCheckable')
			this.$search=$('<div class="popup"/>')
				.hide().appendTo(this.$el.css({position:'relative'})).css({left:'0px'})
				.append(t({title:text('shortcut'),name:'shortcut',type:'radio',options:['All','Mine','Smart']}))
				.append(t({title:text('category'),name:'category',type:'radio',options:Tag.grouped.category}))
				.append(t({title:text('gender'),name:'tags',type:'checkbox',options:Tag.grouped.gender}))
				.append(t({title:text('duration'),name:'tags',type:'checkbox',options:Tag.grouped.duration}))
				.append(t({title:text('goal'),name:'tags',type:'checkbox',options:Tag.grouped.goal}))
		},
		show:function(catId, catName){
			ListPage.prototype.show.apply(this,arguments)
			this.setQuery((new Parse.Query(Post)).equalTo('category',catName).ascending('createdAt'))
			this.$('footer .plus').parent().attr('href','#create/'+catId+"/"+catName)
			this.setTitle(text(catName))
			return this
		},
		showSearchWidget: function(){
			this.$search.show()
				.find('.checkable')
				.addClass('open')
			//shortcut: all, mine, Aging, 
			//category, tag
		}
	}))
})