define(['app','UI', 'i18n!../nls/l10n'],function(app,View, i18n){
	return new (View.Page.extend({
		title:i18n('Analytics')
	}))
}) 