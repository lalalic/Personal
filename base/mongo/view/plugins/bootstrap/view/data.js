define(['app','UI','i18n!../nls/l10n'],function(app,UI,i18n){
	var internal_tables="users,roles".split(',')
	var internal_fields="_id,createdAt,updatedAt,ACL".split(',')
	var ListPage=UI.ListPage,
		Schema=app.Schema,
		Application=app.Application,
		current,
		readonlyFields='_id,createdAt,updatedAt,password'.split(','),
		input=$(document.createElement('input')).addClass('a'),
		switchAppKey=function(e,xhr){
			var current=Application.current()
			current && xhr.setRequestHeader("X-Application-Id", current.get('apiKey'))
		},
		Table=ListPage.extend({
			tagName:'table',
			className:'data hidden',
			events:{
				'change thead input':'onSelectorChange',
				'click th':'onSort',
			},
			template:function(){},
			itemTemplate:function(item){
				var tr=document.createElement('tr')
				var fields=this.model.get('fields')
				var tds=_.map(fields, function(field){
					var value=item.get(field)
					if(_.indexOf(readonlyFields,field)!=-1)
						return '<td class="readonly">'+(value||'')+"</td>"
					return "<td>"+(value||'')+"</td>"
				})
				
				$(tr).html('<td><input type="checkbox"></td>'+tds.join(''))
					.dblclick(_.bind(function(){
						this.currentModel=item
					},this))
					
				item.on('destroy',function(){
					$(tr).remove()
				})
				return tr
			},
			initialize:function(){
				this.collection=app.Model.extend({className:this.model.get('name')}).collection()	
				this._super().initialize.apply(this,arguments)
				this.model.on('destroy',this.remove,this)
				this.$list.remove()
				this.$list=this.$el
				this.createHead()
				this.$el.detach()
			},
			show:function(){
				this.$el.show()
				this.refresh()
			},
			refresh:function(){
				this.collection.fetch()
				return this
			},
			onChangeSchema: function(){
				this.$el.empty()
				this.createHead()
				this.collection.fetch({reset:true})
			},
			onSort: function(e){
				var fieldName=$(e.target).text()
				if(this.collection.comparator==fieldName)
					return this
				this.collection.comparator=fieldName
				this.collection.sort()
				this.$el.find('tbody').remove()
				return this.renderAllItems()
			},
			renderAllItems: function(){
				this.collection.each(this.addOne,this)
				return this
			},
			createHead:function(){
				this.thead=$(document.createElement('tr'))
					.appendTo($('<thead/>').appendTo(this.el))
					.append('<td><input type="checkbox"></td>')
				_.each(this.model.get('fields'),this.appendField,this)
				this.model.on('addColumn',_.bind(this.newField,this))
			},
			newField: function(field){
				$(document.createElement('th'))
					.text(field)
					.insertBefore(this.$('thead th:last-child').prev().prev())
				$('<td/>').insertBefore(this.$('tbody td:last-child').prev().prev())
				return field
			},
			appendField: function(field){
				var th=document.createElement('th')
				this.thead.append($(th).text(field))
				return field
			},
			newModel: function(){
				this.collection.add(new this.collection.model())
				return this
			},
			onSelectorChange: function(e){
				this.$('tbody input[type=checkbox]')
					.prop('checked',e.target.checked)
			},
			removeSelected: function(){
				var me=this
				this.$('tbody input:checked')
					.each(function(){
						$(this).parent().parent().dblclick()
						me.currentModel.destroy()
						me.currentModel=null
					})
			},
			close: function(){
				this.$el.detach()
				return this
			}
		})
	return ListPage.extend({
		newID:0,
		collection:Schema.collection(),
		title:i18n('Data Browser'),
		cmds:'<a class="schema">'+UI.FileLoader+'index</a>\
			<a class="table">'+UI.FileLoader+'<span class="icon download"/><span class="icon remove"/>table</a>\
			<a class="row"><span class="icon remove"/>row</a>',

		events:_.extend({},ListPage.prototype.events,{
			'change a.schema input':'importSchema',
			'click a.schema .download': 'backupSchema',
			
			'click a.table .download': 'backupData',
			'click a.table .remove': 'onRemoveTable',
			'change a.table input':'importData',
			
			'click a.row .remove':'removeSelectedRow'
		}),
		initialize:function(){
			this._super().initialize.apply(this,arguments)
			this.$tables=$('<nav data-control="groupbar"></nav>').insertBefore(this.$('article'))
			this.$list=this.$('article')
			Application.all.on('current',this.refresh,this)
		},
		show: function(table){
			$(document).on('ajaxSend', switchAppKey)
			table=table||'users'
			this._super().show.apply(this,arguments)
			this.$('#__'+table).click()
			return this
		},
		refresh: function(){
			if(this.app==Application.current())
				return
			this.app=Application.current()
			this.$tables.empty()
			this.$list.empty()
			return this._super().refresh.apply(this,arguments)
		},
		close: function(){
			this._super().close.apply(this,arguments)
			Application.all.off('current',this.changeApp,this)
			$(document).off('ajaxSend', switchAppKey)
			return this
		},
		addOne:function(model){
			var table=new Table({model:model}), 
				$a=$('<a/>')
					.text(model.get('name'))
					.attr('id',"__"+model.get('name'))
					.appendTo(this.$tables)
					.click(this.onSwitchTable(table))
			
			if(current==null)
				$a.click()
			else if(model==this.newTable){
				$a.click()
				delete this.newTable
			}
		},
		onSwitchTable:function(table){
			var me=this
			return function(){
				current && current.close()
				current=table
				me.model=current.model
				$(this).addClass('active')
					.siblings('.active').removeClass('active')
				me.$list.append(current.el)
				current.show()
			}
		},
		onRemoveTable: function(){
			var tableName=current.model.get('name')
			if(app[tableName])
				return;
			current.model.destroy()
				.then(_.bind(function(){
					this.$('#__'+tableName).remove()
					this.$tables.find('a').first().click()
				},this))
		},
		removeSelectedRow: function(){
			current.removeSelected()
		},
		importData:function(e){
			var me=this, reader=new FileReader(),
				file=e.target.files[0],
				name=file.name.split('.')[0];
			reader.onloadend=function(a){
				var tableModel=me.collection.get(name),
					docs=JSON.parse(a.target.result);
				if(!tableModel){
					var fields=_.without(_.keys(docs[0]), '_id')
					fields.unshift('_id')
					fields.push('createdAt')
					me.newTable=tableModel=new Schema({name:name, fields:fields})
					me.collection.add(tableModel)
				}
				_.each(docs,function(doc){
					var m=new this.collection.model(doc)
					m.save().then(function(){
						current.collection.add(m)
					})
				},current)
				e.target.value=""
			}
			reader.readAsText(file)
		},
		backupData:function(){
			UI.util.save(btoa(JSON.stringify(current.collection,null,"\t")),
				current.model.get('name')+'.json',
				"application/json")
			return this
		},
		importSchema:function(e){
			var me=this, reader=new FileReader()
			reader.onloadend=function(a){
				var schema=new Function("", "return "+a.target.result)();
				new Schema(schema).save()
				e.target.value=""
			}
			reader.readAsText(e.target.files[0])
		},
		_isEmpty:function(){return false}
	},{
		STYLE:
			"table.data{width:100%}\
			table.data>tbody{background-color:white}\
			table.data>tbody>tr:nth-child(even){background-color:aliceblue}\
			table.data td:empty:before{content:'(undefined)';color:lightgray}\
			table.data th{font-weight:700}\
			table.data td{white-space:nowrap;overflow:hidden;text-overflow: ellipsis; padding-right:7px}\
			table.data thead td:first-child{width:1em}\
			table.data thead th:nth-child(2){width:5em}\
			table.data input[type=checkbox]{margin-left:1px}\
			table.data input.a{width:100%;height:100%;border:0;}"
	})
})