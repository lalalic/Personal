package com.yy.zipweb;

import java.io.File;
import java.io.FileFilter;
import java.io.FileInputStream;
import java.io.FileOutputStream;
import java.io.IOException;
import java.util.Date;
import java.util.Properties;
import java.util.zip.ZipEntry;
import java.util.zip.ZipInputStream;

import org.json.JSONException;
import org.json.JSONObject;

import android.app.ProgressDialog;
import android.content.ContentValues;
import android.content.res.AssetManager;
import android.database.Cursor;
import android.database.sqlite.SQLiteDatabase;
import android.os.Bundle;
import android.util.Log;
import android.view.Menu;

import com.yy.m.data.Configuration;
import com.yy.m.view.WebActivity;

public class Home extends WebActivity {
	@Override
	public void onCreated(Bundle saved) {
		this.cache4Offline=false;
		if(Configuration.getInstance(this).get("installed").length()==0)
			installNatives();
		if(saved!=null && saved.containsKey(LAST_FINAL_URL))
			saved.remove(LAST_FINAL_URL); 
	}
	
	private void installNatives(){
		final ProgressDialog loading = ProgressDialog.show(this.browser.getContext(), 
				"", this.getString(R.string.installingBook)+"...",true,false);
		new Thread(){
			public void run(){
				removeFolder(Home.this.browser.getOfflineRoot());
				AssetManager assetManager = Home.this.getAssets();
		        String[] books = null;
		        Book book=null;
		        try {
		        	books = assetManager.list("books");
		            for (int i = 0; i < books.length; i++){
		            	try {
		            		loading.setTitle(Home.this.getString(R.string.installing)+" "+books[i]+"...");
							book=new Book(new ZipInputStream(assetManager.open("books/"+books[i])),asTitle(books[i]));
							book.install();
							Home.this.browser.runJS("addBook("+book+")");
						} catch (Exception e) {
							
						}
		            }
		         }  catch (IOException e) {
		            
		         }finally{
		        	 Configuration.getInstance(Home.this).set("installed","true");
		        	 loading.dismiss();
		         }
			}
		}.start();
	}
	
	private String asTitle(String name){
		int i=name.lastIndexOf('.');
		if(i==-1)
			return name;
		return name.substring(0, i);
	}
	
	public void install(final String filePath){
		final ProgressDialog loading = ProgressDialog.show(this.browser.getContext(), "", 
				this.getString(R.string.installing)+"...",true,false);
		new Thread(){
			public void run(){
				try {
					File file=new File(filePath);
					Book book=new Book(new ZipInputStream(new FileInputStream(file)), asTitle(file.getName()));
					book.install();
					Home.this.browser.runJS("addBook("+book+")");
				} catch (Exception e) {
					Home.this.notify(e.getMessage());
				}finally{
					loading.dismiss();
				}
			}
		}.start();
	}
	
	public void uninstall(final String url){
		final Book book=new Book(url);
		final ProgressDialog loading = ProgressDialog.show(this.browser.getContext(), 
				"", this.getString(R.string.uninstalling)+" "+book.title,true,false);
		new Thread(){
			@Override
			public void run(){
				book.uninstall();
				loading.dismiss();
			}
		}.start();
	}
	
	public String getAllBooks(){
		SQLiteDatabase db=Configuration.getInstance(this).getReadableDatabase();
		Cursor cursor=db.rawQuery("select url,title,home,path,icon from book", new String[]{});
		StringBuilder books=new StringBuilder();
		while(cursor.moveToNext())
			books.append(",")
				.append((new Book(cursor.getString(0),cursor.getString(1),
						cursor.getString(2),cursor.getString(3),cursor.getString(4))).toString());
		cursor.close();
		db.close();
		return "["+(books.length()>0 ? books.substring(1) : "")+"]";
	}
	
	public String getBook(String url){
		return new Book(url).toString();
	}
	
	@Override
	public boolean onMenuOpened(int featureId, Menu menu) {
		this.browser.loadHome();
		return true;
	}

	protected void removeFolder(String folder){
		File root=new File(folder);
		if(root.exists() && root.isDirectory()){
			root.listFiles(new FileFilter(){
				@Override
				public boolean accept(File file) {
					if(file.isDirectory())
						file.listFiles(this);
					file.delete();
					return false;
				}
			});
			root.delete();
		}
	}

	private class Book{
		String title;
		String path;
		String url;
		String home;
		String icon;
		ZipInputStream is;
		
		Book(String url, String title, String home, String path, String icon){
			this.url=url;
			this.title=title;
			this.home=home;
			this.path=path;
			this.icon=icon;
		}
		Book(String url){
			SQLiteDatabase db=null;
			Cursor cursor=null;
			try {
				db=Configuration.getInstance(Home.this).getReadableDatabase();				
				cursor=db.rawQuery("select title,home,path,icon  from book where url=?", new String[]{url});
				if(cursor.moveToFirst()){
					this.title=cursor.getString(0);
					this.url=url;
					this.home=cursor.getString(1);
					this.path=cursor.getString(2);
					this.icon=cursor.getString(3);
				}
			} finally {
				if(cursor!=null)
					cursor.close();
				if(db!=null)
					db.close();
			}
		}
		
		Book(ZipInputStream is, String title){
			this.is=is;
			this.path=Home.this.browser.getOfflineRoot();
			this.title=title;
		}

		void install() throws Exception{
			SQLiteDatabase db=null;
			try {
				unzip();
				Configuration conf=Configuration.getInstance(Home.this);
				String oldPath=conf.getValue("select path from book where url=?",new String[]{this.url});
				if(oldPath!=null)
					removeFolder(oldPath);
				db=conf.getWritableDatabase();
				ContentValues values=new ContentValues();
				values.put("url", this.url);
				values.put("title", this.title);
				values.put("home", this.home);
				values.put("path", this.path);
				values.put("icon", this.icon);
				
				if(0==db.update("book", values, "url=?", new String[]{this.url}))
					db.insert("book", null, values);
			} finally{
				if(db!=null)
					db.close();
			}
		}
		
		public String toString(){
			JSONObject values=new JSONObject();
			try {
				values.put("url", this.url);
				values.put("title", this.title);
				values.put("home", this.home);
				values.put("path", this.path);
				values.put("icon", this.icon);
			} catch (JSONException e) {
				
			}
			return values.toString();
		}
		
		public void uninstall(){
			SQLiteDatabase db=Configuration.getInstance(Home.this).getWritableDatabase();
			db.delete("book", "url=?", new String[]{this.url});
			removeFolder(this.path);
			db.close();
		}
		
		void unzip() throws Exception{
			this.path = this.path+String.valueOf(new Date().getTime())+File.separator;
			ZipEntry ze = null;
			byte[] buffer = new byte[1024];
			int len = 0;
			
			try {
				while ((ze=is.getNextEntry())!= null) {
					File newFile = new File(this.path + ze.getName());
					FileOutputStream fos=null;
					try {
						if(ze.isDirectory()){
							newFile.mkdirs();
							continue;
						}
						new File(newFile.getParent()).mkdirs();
						fos = new FileOutputStream(newFile);
						while ((len = is.read(buffer)) > 0)
							fos.write(buffer, 0, len);
						fos.close();
						fos=null;
					} catch (Exception e) {
						Log.e("book", ze.getName()+":"+e.getMessage());
					}finally{
						if(fos!=null)
							fos.close();
					}
				}
				Properties info = new Properties();
				info.load(new FileInputStream(this.path + "info.properties"));
				this.url=info.getProperty("url");
				this.home=info.getProperty("home");
				if(this.title==null)
					this.title=info.getProperty("title");
				this.icon=info.getProperty("icon");
			} finally {
				try {
					is.closeEntry();
					is.close();
				} catch (IOException e) {
					Log.e("Book", e.getMessage());
				}
			}
		}
	}
}
