define(['app','view/base'],function(app,View){
	var ListPage=View.ListPage,
		Schema=app.Schema,Application=app.Application
	$('body').append('<style>\
	table.data{width:100%}\
	table.data th{text-align:center;font-weight:700}\
	table.data td, table.data th{border:1px solid lightgray}\
	</style>');
	return new (ListPage.extend({
		title:text('Data Browser'),
		cmds:'<a><span class="icon plus"/>row</a>\
			<a><span class="icon remove"/>row</a>\
			<a><span class="icon remove"/>all row</a>\
			<a><span class="icon plus"/>field</a>\
			<a><span class="icon remove"/>field</a>\
			<a><span class="icon remove"/>class</a>',
		initialize:function(){
			this.collection=Schema.collection()
			ListPage.prototype.initialize.apply(this,arguments)
			this.$tables=$('<nav data-control="groupbar"/>').insertBefore(this.$('article'))
			var me=this
			this.$tables.on('click','a',function(){
				$(this).addClass('active')
					.siblings('.active').removeClass('active')
				me.showTable($(this).text())
			})
			Application.all.on('current',this.changeApp,this)
			this.changeApp()
		},
		changeApp:function(){
			this.$tables.empty()
			this.collection.fetch()
		},
		addOne:function(table){
			var $a=$('<a/>').text(table.get('name')).appendTo(this.$tables)
			this.$('article').append(_.template('#tmplTable',table))
			if(this.$('article>table').length==1){
				$a.addClass('active')
				this.showTable(table.get('name'))
			}
		},
		showTable: function(name){
			this.$('#table_'+name).show().addClass('active')
				.siblings('table.active').hide().removeClass('active')
		}
	}))
})