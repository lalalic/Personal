define(['tool/offline'],function(offline){
var timeout=10*1000,pending=/^pending/
	function asyncIt(p,msgTimeout,more){
		if(_.isFunction(msgTimeout)){
			more=msgTimeout
			msgTimeout=null
		}
		waitsFor(function(){return p._resolved || p._rejected},msgTimeout||'time out',timeout)
		runs(function(){
			expect(p._resolved, p._error).toBe(true)
			more && more()
		})
	}
	return describe('offline',function(){
		var schema=function(Type){
				return {
					book: Type.TABLE.extend({
						fields:{name:Type.TEXT,owner:Type.TEXT}
					})
				}	
			},
			Book=Parse.Object.extend('book')
		it('clear schema',function(){
			asyncIt(offline.clear())
		})
		
		it('clear book schema',function(){
			asyncIt(offline.clear(schema))
		})
		
		it('initialize book schema',function(){
			asyncIt(offline.init(schema))
		})
	
		describe('Parse offline support',function(){
			beforeEach(function(){
				$.isOnline=function(){return false}
			})
			afterEach(function(){
				$.isOnline=function(){return navigator.onLine}
			})

			it('create object',function(){
				var book=new Book()
				book.set('name','abook')
				book.set('owner','raymond')
				asyncIt(book.save(),function(){
					expect(book.id,'book should start with "pending"').toMatch(pending)
					expect(book.get('name'),'name should be "abook"').toBe('abook')
					expect(book.get('owner'),'owner should be "raymond"').toBe('raymond')
				})
			})
			
			it('query created object',function(){
				var p=(new Parse.Query(Book)).find(),books
				p.then(function(b){books=b})
				asyncIt(p,function(){
					expect(books.length).toBeGreaterThan(0)
				})
			})
			
			it('destroy object',function(){
				var p=new Parse.Query(Book).first(),
					book, p1=new Parse.Promise, id
				p.then(function(b){book=b})
				asyncIt(p,function(){
					expect(book).toBeTruthy()
					id=book.id
					book.destroy().then(function(){
						p1.resolve()
					},function(){p1.reject()})
				})
				
				asyncIt(p1,function(){
					var checkP=offline.websql.run('select * from pending where objectId=?',[id])
					var result=new Parse.Promise
					checkP.then(function(tx,rs){
						if(rs.rows.length==0)
							result.resolve()
						else
							result.reject()
					})
					asyncIt(checkP)
					asyncIt(result)
				})
			})
		})
		
		if($.isOnline()){
			it('sync to server', function(){
				asyncIt(offline.websql.run('delete from pending'),function(){
					$.isOnline=function(){return false}
					var book=new Book(), p=new Parse.Promise
					book.set('name','abook')
					book.set('owner','raymond')
					asyncIt(book.save(),function(){
						expect(book.id,'book should start with "pending"').toMatch(pending)
						$.isOnline=function(){return navigator.onLine}
						function synced(pended){
							book=pended	
							p.resolve()
						}
						offline.on('syncedOne',synced)
						asyncIt(offline.sync(),function(){
							offline.off('syncedOne',synced)
							asyncIt(p,function(){
								expect(book).toBeTruthy()
								expect(book.objectId).not.toMatch(pending)
								asyncIt(new Book(book).destroy())
							})
						})
					})
				})
			})
		}
		
		it('clear book schema',function(){
			asyncIt(offline.clear(schema))
		})
	})
	
		
})