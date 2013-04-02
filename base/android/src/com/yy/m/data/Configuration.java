package com.yy.m.data;

import org.apache.http.impl.cookie.BasicClientCookie2;

import android.content.ContentValues;
import android.content.Context;
import android.database.Cursor;
import android.database.sqlite.SQLiteDatabase;
import android.database.sqlite.SQLiteOpenHelper;
import android.util.Log;

import com.yy.m.R;

public class Configuration extends SQLiteOpenHelper{
	public static final String DB_NAME="APP";
	private static final int DB_VERSION = 1;
	public static final String TABLE_CONF="CONF";
	
	public static BasicClientCookie2 sessionCookie = null;
	private static Configuration conf;
	private Context ctx;

	public static Configuration getInstance(Context ctx) {
		if (conf != null)
			return conf;
		conf = new Configuration(ctx);
		return conf;
	}

	private Configuration(Context ctx) {
		super(ctx, DB_NAME, null, DB_VERSION);
		this.ctx=ctx;
	}
	
	public void set(String name, String value) {
		ContentValues values=new ContentValues();
		values.put("key", name);
		values.put("value", value);
		SQLiteDatabase db=this.getWritableDatabase();
		if(db.update(TABLE_CONF, values, "key=?", new String[]{name})==0)
			if(-1==db.insert(TABLE_CONF, null, values))
				throw new RuntimeException("DB error");
		db.close();
	}

	public String get(String name) {
		SQLiteDatabase db=null;
		Cursor cursor=null;
		try {
			db=this.getReadableDatabase();
			cursor=db.rawQuery("select value from conf where key=?",new String[]{name});
			if(cursor.moveToFirst())
				return cursor.getString(0);
			return "";
		} finally {
			if(cursor!=null)
				cursor.close();
			if(db!=null)
				db.close();
		}
	}
	
	public int getInt(String name){
		try {
			return Integer.parseInt(get(name));
		} catch (NumberFormatException e) {
			return 0;
		}
	}
	
	public long getLong(String name){
		try {
			return Long.parseLong(get(name));
		} catch (NumberFormatException e) {
			return 0;
		}
	}
	
	public float getFloat(String name){
		try {
			return Float.parseFloat(get(name));
		} catch (NumberFormatException e) {
			return 0;
		}
	}
	
	public void remove(String name){
		this.getWritableDatabase().delete(TABLE_CONF, "key=?", new String[]{name});
	}

	public void setSession(String id, String domain){
		if(sessionCookie!=null){
			if(!id.equals(sessionCookie.getValue()))
					sessionCookie.setValue(id);
		}else{
			sessionCookie=new BasicClientCookie2("JSESSIONID",id);
			sessionCookie.setDomain(domain);
			Log.d(ctx.getApplicationInfo().name, "Save Session :"+id);
		}
	}
	
	public String getValue(String sql, String[] arguments){
		SQLiteDatabase db=null;
		Cursor cursor=null;
		try {
			db=this.getReadableDatabase();
			cursor=db.rawQuery(sql, arguments);
			if(cursor.moveToFirst())
				return cursor.getString(0);
			return null;
		} finally {
			if(cursor!=null)
				cursor.close();
			if(db!=null)
				db.close();
		}
	}
	
	@Override
	public void onCreate(SQLiteDatabase db) {
		db.execSQL("CREATE TABLE CONF(KEY TEXT PRIMARY KEY,VALUE TEXT NOT NULL)");
		String[] schema=this.ctx.getResources().getStringArray(R.array.schema);
		for(String table : schema)
			db.execSQL(table);
	}

	@Override
	public void onUpgrade(SQLiteDatabase db, int oldVersion, int newVersion) {
	}

}