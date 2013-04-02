package com.equ.photo;

import java.io.File;
import java.util.ArrayList;
import java.util.List;

import org.apache.http.entity.mime.MultipartEntity;
import org.apache.http.entity.mime.content.FileBody;
import org.apache.http.entity.mime.content.StringBody;

import android.database.Cursor;
import android.provider.MediaStore;
import android.util.Log;

import com.equ.R;
import com.equ.service.Updater;
import com.yy.m.data.Configuration;
import com.yy.m.service.AService;

public class PhotoUpdater extends Updater {
	public final static String ACTION_UPLOAD_PHOTOES="equ.track.photo";
	private List<Integer> uploading=new ArrayList<Integer>();
	
	private int uploaded=0;
	
	private String[] fields = {MediaStore.Images.Media.TITLE,
			MediaStore.Images.Media.LATITUDE,
			MediaStore.Images.Media.LONGITUDE,
			MediaStore.Images.Media.MINI_THUMB_MAGIC,
			MediaStore.Images.Media.DATE_TAKEN,
			MediaStore.Images.Media.DATA };
	
	public PhotoUpdater(AService service) {
		super(service);
		String leftUploading=Configuration.getInstance(this.service).get("photoInQueue");
		if(leftUploading!=null){
			String[] ids=leftUploading.split(",");
			if(ids.length<2)
				return;
			for(String id : ids){
				if(id.length()>0)
					uploading.add(Integer.parseInt(id));
			}
		}
	}

	private void save() {
		StringBuilder leftUploading=new StringBuilder();
		for(Integer a : uploading)
			leftUploading.append(",").append(a);
		Configuration.getInstance(this.service)
			.set("photoInQueue", leftUploading.length()>0 ? leftUploading.substring(1) : "");
	}

	@Override
	protected boolean doUpload() {
		if (!isUpdatable)
			return false;

		try {
			Configuration conf=Configuration.getInstance(service);
			String vacationID=conf.get("vacationID");
			if(conf.getInt("whenphoto")==1 && vacationID.length()==0)
				return false;
			
			String url=service.getString(R.string.url_home)+service.getString(R.string.url_upload_photo)+"/upload";
			long lastPhotoUpdateDate=conf.getLong("lastPhotoUpdateDate");
			int i=0;
			while(i<uploading.size()){
				MultipartEntity data = new MultipartEntity();
				while(i<5){
					Cursor cursor=service.getContentResolver().query(
							MediaStore.Images.Media.EXTERNAL_CONTENT_URI, fields,
							null, null, null);
					int iUrl = cursor.getColumnIndex(MediaStore.Images.Media.DATA);
					int iTitle = cursor.getColumnIndex(MediaStore.Images.Media.TITLE);
					int iLat = cursor.getColumnIndex(MediaStore.Images.Media.LATITUDE);
					int iLng = cursor.getColumnIndex(MediaStore.Images.Media.LONGITUDE);
					int iTaken = cursor.getColumnIndex(MediaStore.Images.Media.DATE_TAKEN);
					cursor.moveToFirst();
					String path=cursor.getString(iUrl);
					long lastTaken=cursor.getLong(iTaken);
					if(lastTaken>lastPhotoUpdateDate)
						lastPhotoUpdateDate=lastTaken;
					data.addPart("file",
							new FileBody(new File(path),
									"text/plain; charset=\"UTF-8\""));
					data.addPart(
							"info",
							new StringBody(cursor.getString(iTitle) + ","
									+ cursor.getFloat(iLat) + ","
									+ cursor.getFloat(iLng) + ","
									+ lastTaken));
					i++;
				}
				if(null==post(url, data)){
					return false;
				}else{
					uploaded+=(i-1);
					service.notify(service.getString(R.string.uploaded).replace("ixx", uploaded+""));
					while((--i)>-1)
						uploading.remove(0);
					conf.set("lastPhotoUpdateDate", lastPhotoUpdateDate+"");
				}
			}
		} catch (Throwable e) {
			Log.e(service.getString(R.string.app_name), e.getMessage() , e);
		}

		return true;
	}
	@SuppressWarnings("unchecked")
	@Override
	public void add(Object item) {
		if(item!=null){
			uploading.addAll((List<Integer>)item);
			if(!uploading.isEmpty())
				service.notify(service.getString(R.string.photoInQueue).replace("ixx", uploading.size()+""));
			if(!isUpdatable)
				save();
		}
	}

	@Override
	public void release() {
		save();
	}

}
