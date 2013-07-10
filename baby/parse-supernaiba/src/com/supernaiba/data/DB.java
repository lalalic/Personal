package com.supernaiba.data;

import android.content.ContentValues;
import android.content.Context;
import android.database.Cursor;
import android.database.sqlite.SQLiteDatabase;
import android.database.sqlite.SQLiteOpenHelper;

import com.supernaiba.R;

public class DB extends SQLiteOpenHelper{
	public static final String DB_NAME="APP";
	private static final int DB_VERSION = 1;
	public static final String TABLE_CONF="CONF";
	
	private static DB conf;
	private Context ctx;

	public static DB getInstance(Context ctx) {
		if (conf != null)
			return conf;
		conf = new DB(ctx);
		return conf;
	}

	private DB(Context ctx) {
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
	
	public Cursor load(String sql, String[] arguments){
		SQLiteDatabase db=null;
		Cursor cursor=null;
		try {
			db=this.getReadableDatabase();
			cursor=db.rawQuery(sql, arguments);
			return cursor;
		} finally {
			if(cursor!=null)
				cursor.close();
			if(db!=null)
				db.close();
		}
	}
	
	public void save(final String sql, final Object[][] values){
		new Thread(){
			@Override
			public void run() {
				SQLiteDatabase db=null;
				db=DB.this.getWritableDatabase();
				for(Object[] one: values)
					db.execSQL(sql, one);
				db.close();
			}
		}.start();
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