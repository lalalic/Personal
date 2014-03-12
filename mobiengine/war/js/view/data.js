define(['app','UI'],function(app,View){
	var ListPage=View.ListPage,
		Schema=app.Schema,Application=app.Application
	$('body').append('<style>\
	table.data{width:100%}\
	table.data th{text-align:center;font-weight:700}\
	table.data td, table.data th{border:1px solid lightgray}\
	</style>');
	var current, 
		clazzes={_user:'User',_role:'Role',_app:'Application'},
		Table=ListPage.extend({
			tagName:'table',
			className:'data hidden',
			template:function(){},
			initialize:function(){
				var clazz=this.model.get('name')
				clazz=(clazzes[clazz]||clazz)
				this.collection=app[clazz].collection()
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
		title:text('Data Browser'),
		cmds:'<a><span class="icon plus"/>row</a>\
			<a><span class="icon remove"/>row</a>\
			<a><span class="icon plus"/>field</a>\
			<a><span class="icon remove"/>field</a>\
			<a><span class="icon remove"/>class</a>',
		events:_.extend({},ListPage.prototype.events,{

		}),
		initialize:function(){
			this.collection=Schema.collection()
			ListPage.prototype.initialize.apply(this,arguments)
			this.$tables=$('<nav data-control="groupbar"/>').insertBefore(this.$('article'))
			this.$list=this.$('article')
			Application.all.on('current',this.changeApp,this)
			this.changeApp()
		},
		changeApp:function(){
			this.$tables.empty()
			this.$list.empty()
			this.collection.fetch()
		},
		addOne:function(model){
			var table=new Table({model:model}), 
				$a=$('<a/>')
					.text(model.get('name'))
					.appendTo(this.$tables)
					.click(function(){
						current=table
						$(this).addClass('active')
							.siblings('.active').removeClass('active')
						table.show()
					})
			
			this.$list.append(table.el)
			current==null && $a.click()
		}
	}))
})