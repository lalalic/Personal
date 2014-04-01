mobile application engine
=========================
A appengine framework to help create mobile app quickly on google appengine with datastore support. 

how to start
------------
You should start from <a href="module-requireJSConf.html">requireJSConf module</a> and <a href="app.html">app namespace</a>.

you can start from following html file.
<pre><code>
&lt;!DOCTYPE html&gt;
&lt;html&gt;
&lt;head&gt;
	&lt;meta charset="utf-8"&gt;
	&lt;meta name="format-detection" content="telephone=no" /&gt;
	&lt;!-- WARNING: for iOS 7, remove the width=device-width and height=device-height attributes. See https://issues.apache.org/jira/browse/CB-4323 --&gt;
	&lt;meta name="viewport" content="user-scalable=no, initial-scale=1, maximum-scale=1, minimum-scale=1, width=device-width, height=device-height, target-densitydpi=medium-dpi" /&gt;
	&lt;title&gt;Mobile Engine&lt;/title&gt;
	&lt;link rel="stylesheet" href="css/icon.css"&gt;
	&lt;link rel="stylesheet" href="css/lungo.css"&gt;
	&lt;link rel="stylesheet" href="css/lungo.theme.css"&gt;
	&lt;script data-main="js/main" src="js/lib/require.js"&gt;&lt;/script&gt;
&lt;/head&gt;
&lt;body data-device="phone" data-position="absolute"&gt;
&lt;section id="splash" class="show"&gt;
	&lt;style&gt;
	.slides{position:absolute;height:100%;background-color:black}
	.slides&gt;div{display:table-cell;background-repeat:no-repeat;background-position:center center}
	&lt;/style&gt;
	&lt;article class="active"&gt;
		&lt;div class="slides"&gt;
			&lt;div style="text-align:center;vertical-align:middle"&gt;
				&lt;a  style="position:absolute" class="doing"&gt;&lt;span class="icon refresh" style="color:white"/&gt;&lt;/a&gt;
			&lt;/div&gt;
			&lt;!--div style="background-image:url(http://lorempixel.com/320/418/people/)"&gt;&lt;/div&gt;
			&lt;div style="background-image:url(http://lorempixel.com/320/418/food/)"&gt;&lt;/div--&gt;
		&lt;/div&gt;
	&lt;/article&gt;
&lt;/section&gt;
&lt;/body&gt;
&lt;/html&gt;
</code></pre>