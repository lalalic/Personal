define(['app','UI','jQuery'],function(app,View, $){
	var ListPage=View.ListPage,
		Schema=app.Schema,Application=app.Application
	$('body').append('<style>\
	table.data{width:100%}\
	table.data th{text-align:center;font-weight:700}\
	table.data td, table.data th{border:1px solid lightgray}\
	</style>');
	var current,
		switchAppKey=function(e,xhr){
			var current=Application.current()
			current && xhr.setRequestHeader("X-Application-Id", current.get('apiKey'))
		},
		Table=ListPage.extend({
			tagName:'table',
			className:'data hidden',
			template:function(){},
			itemTemplate:function(item){
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
			},
			initialize:function(){
				var clazz=this.model.get('name')
				if(clazz in app)
					this.collection=app[clazz].collection()
				else
					this.collection=app.createKind(clazz).collection()
					
				ListPage.prototype.initialize.apply(this,arguments)
				this.model.on('destroy',this.destroy,this)
				this.$list.remove()
				this.$list=this.$el
				this.createHead()
			},
			show:function(){
				this.$el.show().siblings('table').hide()
				this.refresh()
			},
			refresh:function(){
				this.collection.fetch()
			},
			createHead:function(){
				this.thead=$(document.createElement('tr')).appendTo(this.el)
					.append('<td style="width:1px"><input type="checkbox"></td>')
				_.each(this.model.get('fields'),this.appendField,this)
				this.model.on('addColumn',_.bind(this.newField,this))
			},
			newField: function(field){
				if(field.name=='password')
					return
				var th=document.createElement('th')
				$(th).text(field.name).insertBefore(this.newFieldTh)
				return field
			},
			appendField: function(field){
				if(field.name=='password')
					return
				var th=document.createElement('th')
				this.thead.append($(th).text(field.name))
				if(field.name=='createdAt')
					this.newFieldTh=th
				return field
			},
			destroy: function(){
				var me=this, args=arguments
				return this.model.destroy()
					.then(function(){
						ListPage.prototype.destroy.apply(me,args)
					})
			}
		}),
		columnUI=new (View.Popup.extend({
			model:{},
			className:'form',
			template:_.template($("#tmplColumnUI").html()),
			events:{
				"click button.cancel":'close',
				"click button.create":'create',
				'change input[name]':'change'
			},
			render: function(){
				this.$el.html(this.template({}));
				return this
			},
			show: function(){
				this.$('input[name]').val('')
				return View.Popup.prototype.show.apply(this,arguments)
			},
			change: function(e){
				var el=e.target
				this.model[el.name]=el.value
				return this
			},
			create: function(){
				current.model.addColumn(this.model)
				this.model={}
			}
		}));
	return new (ListPage.extend({
		newID:0,
		collection:Schema.collection(),
		title:text('Data Browser'),
		cmds:'<a class="row"><span class="icon plus"/>row</a>\
			<a class="row"><span class="icon remove"/>row</a>\
			<a class="column"><span class="icon plus"/>column</a>\
			<a class="table"><span class="icon remove"/>table</a>',
		events:_.extend({},ListPage.prototype.events,{
			"click a.column":'onNewColumn',
			"click a.table": 'onRemoveTable'
		}),
		initialize:function(){
			ListPage.prototype.initialize.apply(this,arguments)
			this.$tables=$('<nav data-control="groupbar"></nav>').insertBefore(this.$('article'))
			this.$createTable=$('<a class="createTable"><span class="icon plus"/></a>').appendTo(this.$tables)
				.click(_.bind(this.onNewTable,this))
			this.$list=this.$('article')
		},
		changeApp:function(m){
			if(this.app==m)
				return
			this.app=m
			this.$createTable.siblings().remove()
			this.$list.empty()
			this.collection.fetch()
		},
		show: function(){
			$(document).on('ajaxSend', switchAppKey)
			this.changeApp(Application.current())
			Application.all.on('current',this.changeApp,this)
			return ListPage.prototype.show.apply(this,arguments)
		},
		close: function(){
			ListPage.prototype.close.apply(this,arguments)
			Application.all.off('current',this.changeApp,this)
			$(document).off('ajaxSend', switchAppKey)
			return this
		},
		addOne:function(model){
			var table=new Table({model:model}), 
				$a=$('<a/>')
					.text(model.get('name'))
					.insertBefore(this.$createTable)
					.click(this.onSwitchTable(table))
			
			this.$list.append(table.el)
			if(current==null || model.isNew())
				$a.click()
		},
		onSwitchTable:function(table){
			var me=this
			return function(){
				current=table
				me.model=current.model
				$(this).addClass('active')
					.siblings('.active').removeClass('active')
				table.show()
			}
		},
		onNewTable:function(){
			var me=this,table=new Schema()
			prompt(text('please input the table name'),'table'+(this.newID++))
				.then(function(name){
					table.set('name',name)
					table.save().then(function(){
						me.collection.add(table)
					})
				})
		},
		onNewColumn: function(){
			columnUI.show()
		},
		onRemoveTable: function(){
			current.destroy()
			.then(function(){
				var theA=this.$tables.find('a.active')
				theA.nearest('a').click()
				theA.remvoe()
			})
		}
	}))
})