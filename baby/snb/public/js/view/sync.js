define(['view/base','tool/offline'],function(View,offline){
	var ListPage=View.ListPage
	return new (ListPage.extend({
		itemTemplate:'#tmplSyncItem',
		collection: new Parse.Collection,
		initialize: function(){
			ListPage.prototype.initialize.apply(this,arguments)
			offline.on('sync',function(rs){
				for(var i=0,len=rs.rows.length;i<len;i++){
					this.addOne(rs.rows.item(i))
				}
			},this)
			
			offline.on('syncingOne',this.syncingOne,this)
			offline.on('syncedOne',this.syncedOne,this)
			offline.on('syncedOneFailed', this.syncedOneFailed,this)
		},
		syncingOne: function(row){
			this.$el.find('#sync_'+row.createdAt).css('background-color','yellow')
		},
		syncedOne: function(row,object){
			this.$el.find('#sync_'+row.createdAt).css('background-color','green')
		},
		syncedOneFailed: function(row, error){
			this.$el.find('#sync_'+row.createdAt).css('background-color','red')
		},
		start: function(autoHide){
			var me=this, promise=new Promise
			offline.sync()
				.then(function(){
					autoHide && me.hide()
					promise.resolve()
				},function(e){
					promise.reject(e)
				})
			return promise
		},
		refresh: function(){
			ListPage.prototype.refresh.apply(this,arguments)
			this.start()
			return this
		}
	}));
})