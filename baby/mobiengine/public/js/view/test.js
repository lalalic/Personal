define(['spec','UI','lib/jasmine'],function(Specs,View){
	window.asyncIt=function(p,msgTimeout,more,timeout){
		if(_.isFunction(msgTimeout)){
			more=msgTimeout
			msgTimeout=null
		}
		waitsFor(function(){return p._resolved || p._rejected},msgTimeout||'time out',timeout||10000)
		runs(function(){
			expect(p._resolved, p._error).toBe(true)
			more && more()
		})
	}
	
	var _expect=jasmine.Spec.prototype.expect
	jasmine.Spec.prototype.expect=function(actual,msgFailed){
		var p=_expect.apply(this,arguments)
		if(msgFailed)
			p.message=p.not.message=function(){return msgFailed}
		return p
	}
	expect=function(actual,msgFailed){
		return jasmine.getEnv().currentSpec.expect(actual,msgFailed);
	}
	jasmine.Spec.prototype.log=function(m){
		if(_.has(this,'el'))
			this.el.append($("<div class='level2 log'>",{text:m}))
		else
			console.log(m)
	}
	
	
	var Reporter=function TestReporter(el,page){
		this.$el=el
		page.find('footer a').click(function(){
			el.find('li.spec').hide()
				.filter('li.'+$(this).attr('status')).toggle()
		})
		this.$passed=page.find('footer .passed span.count')
		this.$failed=page.find('footer .failed span.count')
		this.$skipped=page.find('footer .skipped span.count')
	}
	_.extend(Reporter.prototype,jasmine.Reporter.prototype,{
		done:0,
		failed:0,
		passed:0,
		skipped:0,
		reportRunnerStarting: function(runner){
			
			
		},
		reportRunnerResults: function(runner){//finished all
			
		},
		reportSuiteResults: function(suite){//finished suite
			
		},
		reportSpecStarting: function(spec){
			spec.el=$('<li>',{text:spec.description,class:'testing small spec level'+(this.getLevel(spec.suite)+1)})
				.appendTo(this.$el)
		},
		reportSpecResults: function(spec){
			var results=spec.results(),	
				status=results.skipped ? 'skipped' : (results.failedCount==0 ? 'passed' : 'failed')
			this.done++;
			this[status]++
			spec.el.removeClass('testing').addClass(status)
			this.$passed.text(this.passed)
			this.$failed.text(this.failed)
			this.$skipped.text(this.skipped)
			if(status=='failed'){
				_.each(results.getItems(),function(result){
					if(!result.passed())
						spec.el.append($('<div class="level2">',
							{html:result.message + " <br/> "+ 
								(result.trace.stack&&result.trace.stack.replace(/\s+at\s+/ig,'<br>at '))}))
				},this)
			}
		},
		log: function(m){
			jasmin.log(m)
		},
		getLevel: function(suite){
			if(!_.has(suite,'level')){
				if(suite.parentSuite)
					suite.level=this.getLevel(suite.parentSuite)+1
				else
					suite.level=1;
				suite.el=$('<li>',{text:suite.description,class:'level'+suite.level+' suite'}).appendTo(this.$el)
			}
			return suite.level
		}
	});
	
	var Page=View.Page, ready=new $.Deferred
	return new (Page.extend({
		title:'Test',
		content:'<ul><li><textarea style="width:100%;height:100px"></textarea><div class="specs"></div></li></ul>',
		cmds:'<a class="passed" status="passed"><span class="icon passed"/><span class="tag count"/></a>\
			<a class="failed" status="failed"><span class="icon failed"/><span class="tag count"/></a>\
			<a class="skipped" status="skipped"><span class="icon filter"/><span class="tag count"/></a>',
		events: _.extend({},Page.prototype.events,{'change textarea':'debug'}),
		initialize: function(){
			this._super().initialize.apply(this,arguments)
			var env= this.jasmin = jasmine.getEnv();
			env.updateInterval = 1000;
			env.addReporter(new Reporter(this.$('ul'), this.$el))
			this.$('article').addClass('list')
			this.addStyles()
			this.$el.find('div.specs')
				.append(_.template('#tmplSpecs',{title:'Specs',specs:Specs}))
		},
		debug: function(e){
			new Function("",e.srcElement.value).call(this)
			return this
		},
		ready: function(){
			this.remove()
			ready.resolve()
		},
		test: function(specs){
			this.show()
			_.each((_.isArray(specs)?specs:[specs]),function(spec){
				this.test1(spec)
			},this)
			return ready
		},
		test1: function(spec){
			var me=this, spec='spec/'+spec
			require([spec],function(suite){
				me.jasmin.execute()
				require.undef(spec)
			})
		},
		addStyles: function(){
			var styles=[], delta=20
			for(var i=2;i<7;i++)
				styles.push('.level'+i+'{padding-left:'+(delta*(i-1))+'px!important}')
			styles.push('.testing{color:yellow}')
			styles.push('.passed{color:green}')
			styles.push('.failed{color:red}')
			styles.push('.skipped{color:gray}')
			styles.push('.log{color:blue}')
			styles.push('div.level2{margin-bottom:10px}')
			this.$el.append('<style>'+styles.join('\n')+'</style>')
		},
		clear: function(){
			this.$el.find('.spec,.suite').remove()
			return this
		},
		refresh: function(){
			var me=this
			this.clear()
			this.$el.find('.specs input:checked')
				.each(function(){
					me.test1(this.value)
				})
			return this
		}
	}))
})