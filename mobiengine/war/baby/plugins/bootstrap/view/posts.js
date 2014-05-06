define(['UI','app','i18n!../nls/i18n'],function(View,app,i18n){
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
					{{_.template("#tmplCheckable",({title:'+i18n("shortcut")+',name:"shortcut",type:"radio",options:["All","Mine","Smart"]}))}}\
					{{_.template("#tmplCheckable",({title:'+i18n("category")+',name:"category",type:"radio",options:Tag.grouped.category}))}}\
				</div>\
				<div>\
					{{_.template("#tmplCheckable",({title:'+i18n("gender")+',name:"tags",type:"checkbox",options:Tag.grouped.gender}))}}\
					{{_.template("#tmplCheckable",({title:'+i18n("duration")+',name:"tags",type:"checkbox",options:Tag.grouped.duration}))}}\
					{{_.template("#tmplCheckable",({title:'+i18n("goal")+',name:"tags",type:"checkbox",options:Tag.grouped.goal}))}}\
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
			if(this.catId==(catId=parseInt(catId)))
				return this
			this.catId=catId
			this.collection.query.equalTo('category',catId)
			this._super().show.apply(this,arguments)
			this.$('footer .plus').parent().attr('href','#create/'+catId+"/"+catName)
			this.setTitle(i18n(catName))
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