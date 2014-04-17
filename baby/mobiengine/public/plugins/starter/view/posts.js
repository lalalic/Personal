define(['UI','app'],function(View,app){
	var tmplPosts='\
			<li class="thumb" id="_{{id}}">\
				<img src="{{get("thumbnail")}}">\
				<div>\
					<strong><a href="#show/{{id}}">{{get("title")}}</a></strong>\
					<a class="on-right"><span class="icon user"> {{get("authorName")}}</span>\
						<span class="icon time"  style="padding-right:20px"> {{get("createdAt")}}</span></a>\
					<a href="#comments/{{id}}" class="on-right"><span class="cunt">{{get("comments")}}</span></a>\
					<a href="#update/{{id}}" class="on-right"><span class="icon edit"/></a>\
				</div>\
			</li>'
		tmplSearch='\
			<div class="popup hide">\
				<div>\
					{{_.template("#tmplCheckable",({title:text("shortcut"),name:"shortcut",type:"radio",options:["All","Mine","Smart"]}))}}\
					{{_.template("#tmplCheckable",({title:text("category"),name:"category",type:"radio",options:Tag.grouped.category}))}}\
				</div>\
				<div>\
					{{_.template("#tmplCheckable",({title:text("gender"),name:"tags",type:"checkbox",options:Tag.grouped.gender}))}}\
					{{_.template("#tmplCheckable",({title:text("duration"),name:"tags",type:"checkbox",options:Tag.grouped.duration}))}}\
					{{_.template("#tmplCheckable",({title:text("goal"),name:"tags",type:"checkbox",options:Tag.grouped.goal}))}}\
				</div>\
			</div>'
	var ListPage=View.ListPage, Post=app.Post, Tag=app.Tag
	return new (ListPage.extend({
		itemTemplate:_.template(tmplPosts),
		cmds:'<a href="#create"><span class="icon plus"/></a><a><span class="icon search"/></a>',
		collection:Post.collection(),
		events: _.extend({},ListPage.prototype.events,{
			'click span.search':'showSearchWidget'
		}),
		render:function(){
			this._super().render.apply(this,arguments)
			this.$search=this.$el.css({position:'relative'})
				.append(_.template(tmplSearch,app))
				.find('.popup')
					.hide()
					.css({left:'0px'})
			return this
		},
		show:function(catId, catName){
			if(this.catId==catId)
				return this
			this.catId=catId
			this.collection.query.equalTo('category',catName)
			this._super().show.apply(this,arguments)
			this.$('footer .plus').parent().attr('href','#create/'+catId+"/"+catName)
			this.setTitle(text(catName))
			return this
		},
		refresh: function(){
			this.catId && this._super().refresh.apply(this,arguments)
			return this
		},
		showSearchWidget: function(e){
			this.popup(this.$search,e)
			this.$search.find('.checkable').addClass('open')
		}
	}))
})