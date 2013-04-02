package com.equ.photo;

import java.util.ArrayList;
import java.util.List;

import android.app.ProgressDialog;
import android.content.Context;
import android.content.Intent;
import android.database.Cursor;
import android.graphics.Bitmap;
import android.net.Uri;
import android.os.Bundle;
import android.provider.MediaStore;
import android.util.Log;
import android.view.LayoutInflater;
import android.view.View;
import android.view.View.OnClickListener;
import android.view.ViewGroup;
import android.widget.BaseAdapter;
import android.widget.Button;
import android.widget.CheckBox;
import android.widget.GridView;
import android.widget.ImageView;

import com.equ.R;
import com.equ.service.UpdateService;
import com.yy.m.data.Configuration;
import com.yy.m.view.BaseActivity;

public class PhotoUI extends BaseActivity {
	private int count;
	private Bitmap[] thumbnails;
	private boolean[] thumbnailsselection;
	private String[] arrPath;
	private int[] _ids;
	private ImageAdapter imageAdapter;

	@Override
	public void onCreate(Bundle savedInstanceState) {
		super.onCreate(savedInstanceState);
		setContentView(R.layout.photo);
		showPhotoes();
	}
	
	private void showPhotoes(){
		final ProgressDialog dialog = ProgressDialog.show(this, "", 
                getString(R.string.photoLoading), true);
		boolean collected=collectPhotoes();
		dialog.dismiss();
		if(!collected){
			PhotoUI.this.showMessage(R.string.notUpload4NoTracking);
			PhotoUI.this.finish();
		}
		/*
		new Thread(){
			@Override
			public void run() {
				boolean collected=collectPhotoes();
				dialog.dismiss();
				if(!collected){
					PhotoUI.this.showMessage(R.string.notUpload4NoTracking);
					PhotoUI.this.finish();
				}
			}
		}.start();*/
	}

	protected void showMessage(int notupload4notracking) {
		
	}

	public class ImageAdapter extends BaseAdapter {
		private LayoutInflater mInflater;

		public ImageAdapter() {
			mInflater = (LayoutInflater) getSystemService(Context.LAYOUT_INFLATER_SERVICE);
		}

		public int getCount() {
			return count;
		}

		public Object getItem(int position) {
			return position;
		}

		public long getItemId(int position) {
			return position;
		}

		public View getView(int position, View convertView, ViewGroup parent) {
			ViewHolder holder;
			if (convertView == null) {
				holder = new ViewHolder();
				convertView = mInflater.inflate(
						R.layout.galleryitem, null);
				holder.imageview = (ImageView) convertView.findViewById(R.id.thumbImage);
				holder.checkbox = (CheckBox) convertView.findViewById(R.id.itemCheckBox);

				convertView.setTag(holder);
			}
			else {
				holder = (ViewHolder) convertView.getTag();
			}
			holder.checkbox.setId(position);
			holder.imageview.setId(position);
			holder.checkbox.setOnClickListener(new OnClickListener() {

				public void onClick(View v) {
					CheckBox cb = (CheckBox) v;
					int id = cb.getId();
					if (thumbnailsselection[id]){
						cb.setChecked(false);
						thumbnailsselection[id] = false;
					} else {
						cb.setChecked(true);
						thumbnailsselection[id] = true;
					}
				}
			});
			holder.imageview.setOnClickListener(new OnClickListener() {

				public void onClick(View v) {
					int id = v.getId();
					Intent intent = new Intent();
					intent.setAction(Intent.ACTION_VIEW);
					intent.setDataAndType(Uri.parse("file://" + arrPath[id]), "image/*");
					startActivity(intent);
				}
			});
			holder.imageview.setImageBitmap(thumbnails[position]);
			holder.checkbox.setChecked(thumbnailsselection[position]);
			holder.id = position;
			return convertView;
		}
	}
	
	private boolean collectPhotoes(){
		final String[] columns = { MediaStore.Images.Media.DATA, MediaStore.Images.Media._ID };
		final String orderBy = MediaStore.Images.Media.DATE_TAKEN;
		
		Configuration conf=Configuration.getInstance(this);
		long start = conf.getLong("lastPhotoUpdateDate");
		if (start == 0)
			start = conf.getLong("vacationStart");
		if (start == 0) 
			return false;

		long end = conf.getLong("vacationEnd");

		String selection = "datetaken>=" + start;
		if (end != 0)
			selection += " and dateadded<end";
		
		Cursor imagecursor = managedQuery(
				MediaStore.Images.Media.EXTERNAL_CONTENT_URI, columns, selection,
				null, orderBy);
		int image_column_index = imagecursor.getColumnIndex(MediaStore.Images.Media._ID);
		this.count = imagecursor.getCount();
		this.thumbnails = new Bitmap[this.count];
		this.arrPath = new String[this.count];
		this.thumbnailsselection = new boolean[this.count];
		this._ids = new int[this.count];
		for (int i = 0; i < this.count; i++) {
			imagecursor.moveToPosition(i);
			int id = imagecursor.getInt(image_column_index);
			int dataColumnIndex = imagecursor.getColumnIndex(MediaStore.Images.Media.DATA);
			thumbnails[i] = MediaStore.Images.Thumbnails.getThumbnail(
					getApplicationContext().getContentResolver(), id,
					MediaStore.Images.Thumbnails.MICRO_KIND, null);
			arrPath[i]= imagecursor.getString(dataColumnIndex);
			_ids[i]=id;
		}
		GridView imagegrid = (GridView) findViewById(R.id.PhoneImageGrid);
		imageAdapter = new ImageAdapter();
		imagegrid.setAdapter(imageAdapter);
		imagecursor.close();

		final Button selectBtn = (Button) findViewById(R.id.selectBtn);
		selectBtn.setOnClickListener(new OnClickListener() {

			public void onClick(View v) {
				final int len = thumbnailsselection.length;
				int cnt = 0;
				List<Integer> selectedID=new ArrayList<Integer>();
				for (int i =0; i<len; i++)
				{
					if (thumbnailsselection[i]){
						cnt++;
						selectedID.add(_ids[i]);
					}
				}
				if (cnt == 0){
					Log.w(getString(R.string.app_name),getString(R.string.noPhotoSelected));
				} else {
					PhotoUpdater updater=UpdateService.getPhotoService();
					updater.add(selectedID);
					updater.upload();
					PhotoUI.this.finish();
				}
			}
		});
		return true;
	}
	class ViewHolder {
		ImageView imageview;
		CheckBox checkbox;
		int id;
	}
}
