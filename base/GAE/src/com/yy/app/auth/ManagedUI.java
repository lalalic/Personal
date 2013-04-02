package com.yy.app.auth;

import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

public class ManagedUI {
	static List<ManagedUI> managedUIs=new ArrayList<ManagedUI>();
	private static Set<String> urls=new HashSet<String>();
	
	public String category;
	public int order;
	public Set<String> capSet;
	public String name;
	public String url;
	
	public static void addManagedUI(String category, String name, String url,
			String... caps) {
		if(urls.contains(url))
			return;
		Set<String> capSet = new HashSet<String>();
		for (String cap : caps)
			capSet.add(cap);
		ManagedUI ui=new ManagedUI();
		ui.category=category;
		ui.name=name;
		ui.url=url;
		ui.capSet=capSet;
		managedUIs.add(ui);
		urls.add(url);
	}
}
