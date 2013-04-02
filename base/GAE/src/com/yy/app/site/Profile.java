package com.yy.app.site;

import java.io.BufferedReader;
import java.io.FileInputStream;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.io.PrintWriter;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.TreeMap;
import java.util.logging.Logger;

import com.esotericsoftware.yamlbeans.YamlReader;
import com.esotericsoftware.yamlbeans.YamlWriter;
import com.googlecode.objectify.Objectify;
import com.googlecode.objectify.ObjectifyService;
import com.yy.app.auth.Role;
import com.yy.app.auth.User;
import com.yy.app.tag.Tag;

@SuppressWarnings("rawtypes")
public class Profile {
	private static final long serialVersionUID = -1939734880491204773L;
	static final Logger log = Logger.getLogger(Profile.class.getName());
	
	public static Profile I;

	public Profile() {
		I = this;
	}
	
	/*Business Model(objectify models)*/
	public List<Class> modelTypes;
	
	/*Web Site Information*/
	public String name;
	public String description;
	public String defaultTemplate;
	
	/*Account Configuration*/
	public User.View userView = new User.View();
	
	/*Super User Information*/
	private User admin;
	public String adminPassword;
	
	/*Automation Tester Information*/
	public String testerPassword;
	private User tester;
	
	/*Peformance Testing Switch*/
	public boolean trace;

	
	/*Content Configuration*/
	public int pageSize;
	public String blacklist;
	public boolean anonymousComment;

	/*Sina Weibo Connction Information*/
	public Map<String, String> weibo;
	public Map<String, String> wbStatus;
	
	/*System Features*/
	public TreeMap<String, List<String>> versions;
	
	public Tag.View tagger;	
	
	public void setAdmin(User admin) {
		this.admin = Role.initAdminRole(admin.account, admin.email, adminPassword,
				admin.name);
	}

	public User getAdmin() {
		return admin;
	}

	public void setTester(User tester) {
		Objectify store = ObjectifyService.begin();
		this.tester = store.query(tester.getClass())
				.filter("account", tester.account).get();
		if (this.tester == null) {
			tester.setPassword(testerPassword, testerPassword);
			tester.author=admin.ID;
			tester.role=admin.role;
			store.put(tester);
			this.tester = tester;
		}
	}

	public User getTester() {
		return tester;
	}

	public void setWeiboToken(String token) {
		weibo.put("token", token);
	}

	/**
	 * register Objectify models
	 * 
	 * @param models
	 * @throws ClassNotFoundException
	 */
	public void setModels(List<String> models) {
		modelTypes=new ArrayList<Class>(models.size());
		for (String model : models) {
			Class<?> clazz;
			try {
				modelTypes.add(clazz = Class.forName(model));
				ObjectifyService.register(clazz);
				log.fine(model + " regiestered.");
			} catch (ClassNotFoundException e) {
				e.printStackTrace();
				log.severe(model + " class doesn't found");
			}
		}
		log.fine("All model classes are registered.");
	}
	/*yml need set AND get to indicate that it's a property*/
	public List<String> getModels() {return null;}

	// initialize DB
	public void setDb(Map<String, Object> db) {
		try {
			List tags = (List) db.get("tags");
			for (Object t : tags)
				insertTag(t);
		} catch (Exception e) {
			e.printStackTrace();
			log.severe(e.getMessage());
		}
		log.fine("DB has been initiated.");
	}

	public Map getDb() {return null;}

	@SuppressWarnings({ "unchecked" })
	private List<Long> insertTag(Object tag) {
		List<Long> tagIDs = new ArrayList<Long>();
		Objectify store = ObjectifyService.begin();
		if (tag instanceof List) {
			for (Object t : (List) tag)
				tagIDs.addAll(insertTag(t));
		} else if (tag instanceof String) {
			Tag t = store.query(Tag.class).filter("name", tag.toString()).get();
			if (t == null) {
				t = new Tag();
				t.name = tag.toString();
				store.put(t);
			}
			tagIDs.add(t.ID);
		} else if (tag instanceof Map) {
			Map<String, Object> aGroupTag = (Map<String, Object>) tag;
			for (String parent : aGroupTag.keySet()) {
				List<Long> children = insertTag(aGroupTag.get(parent));
				Tag parentTag = store.query(Tag.class).filter("name", parent)
						.get();
				if (parentTag == null) {
					parentTag = new Tag();
					parentTag.name = parent;
				} else if (parentTag.included.equals(children)) {
					tagIDs.add(parentTag.ID);
					continue;
				}
				parentTag.included = children;
				store.put(parentTag);
				tagIDs.add(parentTag.ID);
			}
		}
		return tagIDs;
	}

	/**
	 * Load it in application initiation to create application profile from a yml file
	 */
	public Profile load(final InputStream in) throws Exception {
		YamlReader reader = new YamlReader(new BufferedReader(
				new InputStreamReader(in)));
		try {
			return (Profile) reader.read();
		} catch (Exception e) {
			log.severe(e.getMessage());
			throw e;
		}
	}

	public static void main(String[] args) {
		String path = "C:/Users/lir6/workspace/new/sdanbaba/war/WEB-INF/conf.yml";
		// String path="D:/workspace/www-minicheers/war/WEB-INF/conf.yml";
		try {
			Profile p = new Profile().load(new FileInputStream(path));
			YamlWriter writer = new YamlWriter(new PrintWriter(System.out));
			writer.write(p);
			writer.close();
		} catch (Exception e) {
			e.printStackTrace();
			log.severe(e.getMessage());
		}
	}
}
