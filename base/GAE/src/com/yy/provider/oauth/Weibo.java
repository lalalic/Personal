package com.yy.provider.oauth;

import java.net.HttpURLConnection;
import java.net.URI;
import java.net.URISyntaxException;
import java.net.URL;
import java.util.HashMap;
import java.util.Map;

import org.codehaus.jackson.map.ObjectMapper;
import org.codehaus.jackson.type.TypeReference;

import com.yy.app.site.Profile;

public class Weibo {
	public static final int SOURCE = 1;

	public URI authURI(String target) {
		try {
			return new URI("https://api.weibo.com/oauth2/authorize?client_id=" +  Profile.I.weibo.get("key")
					+ "&response_type=code&redirect_uri=http://www.minicheers.com/user/weibo/oauthed");
					//+ Profile.I.weibo.get("returnURL"));
		} catch (URISyntaxException e) {
			return null;
		}
	}

	public Map<String,Object> getAccessToken(String code) {
		String returnUrl = Profile.I.weibo.get("returnURL");
		String tokenUrl = "https://api.weibo.com/oauth2/access_token?client_id="
				+ Profile.I.weibo.get("key")
				+ "&client_secret="
				+ Profile.I.weibo.get("secret")
				+ "&grant_type=authorization_code&redirect_uri="
				+ returnUrl
				+ "&code=" + code;
		Map<String, Object> data = post(tokenUrl,null);
		return data;
	}

	private Map<String, Object> post(String tokenUrl, String token, Object... params) {
		HttpURLConnection conn = null;
		HashMap<String, Object> res = null;
		try {
			URL url = new URL(tokenUrl);
			conn = (HttpURLConnection) url.openConnection();
			conn.setRequestMethod("POST");
			conn.setUseCaches(false);
			conn.setDoInput(true);
			conn.setDoOutput(true);
			conn.setRequestProperty("Content-Type",
					"application/x-www-form-urlencoded");
			if(token==null)
				token = Profile.I.weibo.get("token");
			if (token != null)
				conn.addRequestProperty("Authorization", "OAuth2 " + token);

			if (params.length == 0) {
				conn.setRequestProperty("Content-Length", "0");
			} else {
				StringBuilder data = new StringBuilder("a=1");
				for (int i = 0; i < params.length; i += 2)
					data.append("&" + params[i].toString() + "="
							+ params[i + 1].toString());
				byte[] bytes = data.toString().getBytes("utf8");
				conn.setRequestProperty("Content-Length", bytes.length + "");
				conn.getOutputStream().write(bytes);
			}
			conn.connect();

			res = new ObjectMapper().readValue(conn.getInputStream(),
					new TypeReference<HashMap<String, Object>>() {
					});
			return res;
		} catch (Exception e) {
			throw new RuntimeException(e.getMessage());
		} finally {
			conn.disconnect();
		}
	}

	public String status(String status) {
		Map<String, Object> data = post(
				"https://api.weibo.com/2/statuses/update.json",null, "status",
				status);
		return data.get("id").toString();
	}
	
	public String repost(String sourceID, String status){
		Map<String, Object> data = post(
				"https://api.weibo.com/2/statuses/repost.json",null, "id",sourceID, "status",
				status);
		return data.get("id").toString();
	}
	
	public Map<String,Object> show(String token, String uid){
		return post("https://api.weibo.com/2/users/show.json",token, "uid",uid);
	}
	
	
}
