package com.yy.app.cms;

import com.googlecode.objectify.ObjectifyService;
import com.yy.app.site.Profile;
import com.yy.provider.oauth.Weibo;

public class Slave extends Post {
	@Override
	protected void post2WB() {
		if (!this.supportWeibo || this.weiboID != null
				|| Profile.I.weibo.get("token") == null)
			return;
		String message = Profile.I.wbStatus
				.get(this.entityType().toLowerCase());
		if (message == null)
			return;
		try {
			Weibo weibo = new Weibo();
			message = message.replaceAll("title1", "#" + this.title + "#")
					.replaceAll("id1", this.ID.toString())
					.replaceAll("excerpt1", this.excerpt)
					.replaceAll("id2", parent.toString());

			Post master = (Post)this.parent.get();
			if (master.weiboID != null)
				this.weiboID = weibo.repost(master.weiboID, message);
			else
				this.weiboID = weibo.status(message);
			ObjectifyService.ofy().save().entity(this);
		} catch (Exception e) {
			e.printStackTrace();
		}
	}

}
