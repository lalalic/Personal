package com.yy.provider.template;

import java.util.HashMap;
import java.util.Map;

import freemarker.cache.CacheStorage;
import freemarker.cache.MruCacheStorage;

public class MultiMruCacheStorage implements CacheStorage {
	public static final ThreadLocal<String> device=new ThreadLocal<String>();
	private Map<String, CacheStorage> caches=new HashMap<String, CacheStorage>();
	
	public MultiMruCacheStorage(int maxStrongSize, int maxSoftSize, String... types){
		for(String type : types)
			caches.put(type, new MruCacheStorage(maxStrongSize,maxSoftSize));
	}
	
	@Override
	public Object get(Object key) {
		return caches.get(device.get()).get(key);
	}
	@Override
	public void put(Object key, Object value) {
		caches.get(device.get()).put(key, value);
	}
	@Override
	public void remove(Object key) {
		caches.get(device.get()).remove(key);
	}
	@Override
	public void clear() {
		caches.get(device.get()).clear();
	}
	
	
}
