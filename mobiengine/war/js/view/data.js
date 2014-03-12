define(['app','UI'],function(app,View){
	var ListPage=View.ListPage,
		Schema=app.Schema,Application=app.Application
	$('body').append('<style>\
	table.data{width:100%}\
	table.data th{text-align:center;font-weight:700}\
	table.data td, table.data th{border:1px solid lightgray}\
	</style>');
	var current,
		Table=ListPage.extend({
			tagName:'table',
			className:'data hidden',
			template:function(){},
			initialize:function(){
				var clazz=this.model.get('name')
				if(clazz in app)
					this.collection=app[clazz].collection()
				else
					this.collection=app.createKind(clazz).collection()
					
				ListPage.prototype.initialize.apply(this,arguments)
				this.$list.remove()
				this.$list=this.$el
				this.createHead()
				this.itemTemplate=function(item){
					var tr=document.createElement('tr')
					var fields=this.model.get('fields')
					var tds=_.map(fields, function(field){
						if(field.name=='password')
							return ''
						var value=item.get(field.name)
						return "<td>"+(value||'&nbsp;')+"</td>"
					})
					$(tr).html('<td><input type="checkbox"></td>'+tds.join(''))
					return tr
				}
			},
			show:function(){
				this.$el.show().siblings('table').hide()
				this.refresh()
			},
			refresh:function(){
				this.collection.fetch()
			},
			createHead:function(){
				var colgroup=$(document.createElement('colgroup')).appendTo(this.el)
				var tr=$(document.createElement('tr')).appendTo(this.el)
				tr.append('<td><input type="checkbox"></td>')
				_.each(this.model.get('fields'),function(field){
					if(field.name=='password')
						return
					var th=document.createElement('th')
					tr.append($(th).text(field.name))
					colgroup.append('<col/>')
				})
			}
		});
	return new (ListPage.extend({
		newID:0,
		title:text('Data Browser'),
		cmds:'<a><span class="icon plus"/>row</a>\
			<a><span class="icon remove"/>row</a>',
		events:_.extend({},ListPage.prototype.events,{

		}),
		initialize:function(){
			this.collection=Schema.collection()
			ListPage.prototype.initialize.apply(this,arguments)
			this.$tables=$('<nav data-control="groupbar"></nav>').insertBefore(this.$('article'))
			this.$createTable=$('<a class="createTable"><span class="icon plus"/></a>').appendTo(this.$tables)
				.click(_.bind(this.newTable,this))
			this.$list=this.$('article')
			Application.all.on('current',this.changeApp,this)
			this.changeApp()
		},
		changeApp:function(){
			this.$createTable.siblings().remove()
			this.$list.empty()
			this.collection.fetch()
		},
		addOne:function(model){
			var table=new Table({model:model}), 
				$a=$('<a/>')
					.text(model.get('name'))
					.insertBefore(this.$createTable)
					.click(function(){
						current=table
						$(this).addClass('active')
							.siblings('.active').removeClass('active')
						table.show()
					})
			
			this.$list.append(table.el)
			if(current==null || model.isNew())
				$a.click()
		},
		newTable:function(){
			var table=new Schema(), 
				name='table'+(this.newID++)
			table.set('name',name)
			this.collection.add(table)
		}
	}))
})