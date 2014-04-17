define(['app','UI','jQuery','Underscore'],function(app,View, $, _){
	var tmplColumn='\
			<fieldset>\
				<input placeholder="'+text('name')+'" name="name" type="text">\
			</fieldset>\
			<fieldset>\
				<label class="select">\
					<select name="type">\
						<%_.each(require("app").Model.DATATYPE,function(o){%> \
						<option value="{{o}}">{{o}}</option>\
						<%})%>\
					</select>\
				</label>\
			</fieldset>\
			<fieldset>\
				<label class="anchor">'+text("Searchable?")+'</label>\
				<input name="searchable" unchecked="unchecked" type="checkbox">\
			</fieldset>\
			<fieldset>\
				<label class="anchor">'+text("Unique?")+'</label>\
				<input name="unique" unchecked="unchecked" type="checkbox">\
			</fieldset>\
			<button class="anchor create" data-callback="accept">'+text('Create Column')+'</button>\
			<button class="anchor cancel" data-callback="cancel">'+text('Cannel')+'</button>'
	
	var ListPage=View.ListPage,
		Schema=app.Schema,
		Application=app.Application,
		current,
		readonlyFields='id,createdAt,updatedAt,password'.split(','),
		input=$(document.createElement('input')).addClass('a'),
		switchAppKey=function(e,xhr){
			var current=Application.current()
			current && xhr.setRequestHeader("X-Application-Id", current.get('apiKey'))
		},
		Table=ListPage.extend({
			tagName:'table',
			className:'data hidden',
			events:{'change thead input':'onSelectorChange'},
			template:function(){},
			itemTemplate:function(item){
				var tr=document.createElement('tr')
				var fields=this.model.get('fields')
				var tds=_.map(fields, function(field){
					var value=item.get(field.name)
					if(_.indexOf(readonlyFields,field.name)!=-1)
						return '<td class="readonly">'+(value||'')+"</td>"
					return "<td>"+(value||'')+"</td>"
				})
				
				$(tr).html('<td><input type="checkbox"></td>'+tds.join(''))
					.dblclick(_.bind(function(){
						this.currentModel=item
					},this))
					
				item.on('sync',function(m){
					if(m.get('updatedAt').getTime()==m.get('createdAt').getTime()){
						$('td:eq(1)',tr).text(m.id)
						$('td:last-child',tr)
							.prev().text(m.get('updatedAt'))
							.prev().text(m.get('createdAt'))
					}else
						$('td:last-child',tr)
							.prev().text(m.get('updatedAt'))
				}).on('destroy',function(){
					$(tr).remove()
				})
				return tr
			},
			initialize:function(){
				this.collection=app.createKind(this.model).collection()	
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
			},
			renderAllItems: function(){
				this.collection.each(this.addOne,this)
				this.newModel()
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
					.text(field.name)
					.insertBefore(this.$('thead th:last-child').prev().prev())
				$('<td/>').insertBefore(this.$('tbody td:last-child').prev().prev())
				return field
			},
			appendField: function(field){
				var th=document.createElement('th')
				this.thead.append($(th).text(field.name))
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
		}),
		columnUI=new (View.Popup.extend({
			model:{searchable:true, unique: false},
			className:'form',
			template:_.template(tmplColumn),
			events:{
				"click button.cancel":'close',
				"click button.create":'create',
				'change [name]':'change'
			},
			render: function(){
				this.$el.html(this.template({}));
				return this
			},
			show: function(){
				this.model={searchable:true, unique: false}
				this.$('input[name]').val('')
				this.$('input[name=searchable]').prop('checked',this.model.searchable)
				this.$('input[name=unique]').prop('checked',this.model.unique)
				return this._super().show.apply(this,arguments)
			},
			change: function(e){
				var el=e.target
				switch(el.name){
				case 'searchable':case 'unique':
					this.model[el.name]=el.checked
					break
				default:
					this.model[el.name]=el.value
				}
				return this
			},
			create: function(){
				current.model.addColumn(this.model)
				this.model={searchable:true, unique: false}
				this.$('input[name=searchable]').prop('checked',this.model.searchable)
				this.$('input[name=unique]').prop('checked',this.model.unique)
			}
		}))
	return new (ListPage.extend({
		newID:0,
		collection:Schema.collection(),
		title:text('Data Browser'),
		cmds:'<a class="backup"><span class="icon data"/><span class="icon schema"/>Backup</a>\
			<a class="table">'+View.FileLoader+'<span class="icon remove"/>table</a>\
			<a class="row"><span class="icon plus"/><span class="icon remove"/>row</a>\
			<a class="column"><span class="icon plus"/><span class="icon remove"/>column</a>\
			<a class="schema">'+View.FileLoader+'schema</a>',

		events:_.extend({},ListPage.prototype.events,{
			'click a.backup .data':'backupData',
			'click a.backup .schema':'backupSchema',
			
			'click a.table .remove': 'onRemoveTable',
			'change a.table input':'importData',
			
			'click a.row .plus':'onNewRow',
			'click a.row .remove':'removeSelectedRow',
			
			'click a.column .plus':'onNewColumn',
			'click a.column .remove':'onRemoveColumn',
			
			'change a.schema input':'importSchema',
			
			'change input.a':'onChangeValue',
			'blur input.a':'onBlurInput',
			'keypress input.a':'onEnterInput',
			'dblclick table.data tbody td:not(.readonly)':'switchInput'
		}),
		initialize:function(){
			this._super().initialize.apply(this,arguments)
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
		show: function(table){
			$(document).on('ajaxSend', switchAppKey)
			this.changeApp(Application.current())
			Application.all.on('current',this.changeApp,this)
			this._super().show.apply(this,arguments)
			table && this.$('nav.groupbar a.__'+table).click()
			return this
		},
		close: function(){
			this._super().close.apply(this,arguments)
			Application.all.off('current',this.changeApp,this)
			$(document).off('ajaxSend', switchAppKey)
			return this
		},
		refresh: function(){
			if(this.$el.is('.show'))
				return this._super().refresh.apply(this,arguments)
			return this
		},
		addOne:function(model){
			var table=new Table({model:model}), 
				$a=$('<a/>')
					.text(model.get('name'))
					.addClass("__"+model.get('name'))
					.insertBefore(this.$createTable)
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
		onNewTable:function(){
			var me=this,table=new Schema()
			prompt(text('please input the table name'),'table'+(this.newID++))
				.then(function(name){
					table.set('name',name,{validate:true})
					table.save().then(function(){
						me.newTable=table
						me.collection.add(table)
					})
				})
		},
		onNewColumn: function(){
			columnUI.show()
		},
		onRemoveTable: function(){
			current.model.destroy()
			.then(_.bind(function(){
				this.$tables.find('a.active').remove()
				this.$tables.find('a').first().click()
			},this))
		},
		onNewRow: function(){
			current.newModel()
		},
		switchInput:function(e, td){
			var schema=current.model,
				td=$(e.target),
				i=$('td',td.parent()).index(td)-1,
				field=schema.get('fields')[i],
				type='text'
			input.removeProp('list')
			switch(field.type){
			case 'Integer':
			case 'Float':
				type='number'
				break
			case 'Date':
				type='date'
				break
			case 'Time':
				type='time'
				break
			case 'DateTime':
				type='datetime'
				break
			case 'File':
				type='file'
				break
			case 'Boolean':
				input.attr('list','Boolean')
				break
			}
			input.prop('type',type)
			input.val(td.text())
				.width(td.width())
				.appendTo(td.empty())
				.focus()
		},
		onChangeValue: function(){
			var schema=current.model,
				model=current.currentModel,
				td=input.parent(),
				i=$('td',td.parent()).index(td)-1,
				field=schema.get('fields')[i],
				value=input.val()
			model.set(field.name,value, {validate:true})
			model.patch(field.name)
		},
		onBlurInput: function(e,td){
			if((td=input.parent()).length==0)
				return;
			try{input.detach()}catch(e){}
			td.html(input.val())
		},
		onEnterInput: function(e){
			e.which==13 &&	input.blur()
		},
		removeSelectedRow: function(){
			current.removeSelected()
		},
		importData:function(e){
			var reader=new FileReader()
			reader.onloadend=function(e){
				_.each($.parseJSON(e.target.result),function(o){
					var m=new this.collection.model(o)
					m.save().then(function(){
						current.collection.add(m)
					})
				},current)
			}
			reader.readAsText(e.target.files[0])
		},
		backupData:function(){
			
		},
		backupSchema:function(){
			
		},
		importSchema:function(e){
			
		}
	},{
		STYLE:
			"table.data{width:100%;table-layout:fixed}\
			table.data>tbody{background-color:white}\
			table.data>tbody>tr:nth-child(even){background-color:aliceblue}\
			table.data td:empty:before{content:'(undefined)';color:lightgray}\
			table.data th{font-weight:700}\
			table.data thead td:first-child{width:1em}\
			table.data thead th:nth-child(2){width:5em}\
			table.data input[type=checkbox]{margin-left:1px}\
			table.data input.a{width:100%;height:100%;border:0;}"
	}))
})