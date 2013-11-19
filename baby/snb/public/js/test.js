define('test',['view/base','lib/jasmine'],function(View){
	window.asyncIt=function(p,msgTimeout,more){
		if(_.isFunction(msgTimeout)){
			more=msgTimeout
			msgTimeout=null
		}
		waitsFor(function(){return p._resolved || p._rejected},msgTimeout||'time out',10*1000)
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
	
	
	var Reporter=function TestReporter(el){
		this.$el=el
		this.$sum=$('<li><button type="button" status="passed" class="accept">Passed <span></span></button>\
				<button type="button" status="failed" class="cancel">Failed <span></span></button>\
				<button type="button" status="skipped" class="skipped">Skipped <span></span></button>\
				</li>')
				.appendTo(this.$el)
		this.$el.find('button').click(function(){
			el.find('li.spec').hide()
				.filter('li.'+$(this).attr('status')).toggle()
		})
		this.$passed=el.find('button.accept span')
		this.$failed=el.find('button.cancel span')
		this.$skipped=el.find('button.skipped span')
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
	
	var Page=View.Page, ready=new Parse.Promise()
	return new (Page.extend({
		title:'Test',
		content:'<ul/>',
		navs:'<a><span class="icon home"/></a>\
				<a class="on-right"><span class="icon refresh"/></a>',
		events: {'click header nav span.home':'ready'},
		initialize: function(){
			Page.prototype.initialize.apply(this,arguments)
			var env= this.jasmin = jasmine.getEnv();
			env.updateInterval = 1000;
			env.addReporter(new Reporter(this.$('ul')))
			this.$('article').addClass('list')
			this.addStyles()
			
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
		}
	}))
})