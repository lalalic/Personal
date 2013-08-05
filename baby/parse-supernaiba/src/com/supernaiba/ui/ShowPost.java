package com.supernaiba.ui;

import greendroid.app.GDActivity;
import greendroid.widget.ActionBar.OnActionBarListener;
import greendroid.widget.ActionBarItem;
import greendroid.widget.ActionBarItem.Type;
import greendroid.widget.LoaderActionBarItem;
import greendroid.widget.ToolBar;

import java.io.IOException;
import java.io.InputStream;
import java.net.MalformedURLException;
import java.util.Date;

import org.apache.http.HttpResponse;
import org.apache.http.client.methods.HttpGet;
import org.apache.http.impl.client.DefaultHttpClient;

import android.content.Context;
import android.content.Intent;
import android.graphics.Canvas;
import android.graphics.Color;
import android.graphics.LightingColorFilter;
import android.graphics.drawable.BitmapDrawable;
import android.graphics.drawable.Drawable;
import android.os.AsyncTask;
import android.os.Bundle;
import android.text.Html;
import android.view.LayoutInflater;
import android.view.View;
import android.widget.ListView;
import android.widget.PopupWindow;
import android.widget.RadioButton;
import android.widget.RadioGroup;
import android.widget.RadioGroup.OnCheckedChangeListener;
import android.widget.TextView;

import com.parse.GetCallback;
import com.parse.ParseException;
import com.parse.ParseObject;
import com.parse.ParseQuery;
import com.parse.ParseQueryAdapter.QueryFactory;
import com.parse.ParseUser;
import com.supernaiba.R;
import com.supernaiba.parse.OnGet;
import com.supernaiba.parse.Query;
import com.supernaiba.parse.QueryAdapter;

public class ShowPost extends GDActivity {
	private String ID;
	private TextView vContent;
	private LoaderActionBarItem refreshAction;
	private ActionBarItem starAction,planAction;
	RadioGroup planTypes;
	private ParseObject post;
	/** Called when the activity is first created. */
	public void onCreate(Bundle savedInstanceState) {
		super.onCreate(savedInstanceState);
		
		this.setActionBarContentView(R.layout.post1);
		vContent=(TextView)findViewById(R.id.content);
		refreshAction=(LoaderActionBarItem)addActionBarItem(Type.Refresh);
		refreshAction.setLoading(true);
		post=ParseObject.createWithoutData("post", ID=getIntent().getStringExtra("ID"));
		
		
		final ToolBar footer=ToolBar.inflate(this);
		footer.setMaxItemCount(5);
		footer.addItem(Type.Edit);//comment
		footer.addItem(Type.Share);
		footer.addItem(Type.Gallery);//story
		starAction=footer.addItem(Type.Star);//favorite
		planAction=footer.addItem(Type.List);//plan
		
		footer.setOnActionBarListener(new OnActionBarListener(){

			@Override
			public void onActionBarItemClicked(int position) {
				switch(position){
				case 0://comment
					Intent intent=new Intent(ShowPost.this,ShowComments.class);
					intent.putExtra("ID", ID);
					startActivity(intent);
				break;
				case 3://favorite
					favorite(new OnGet<ParseObject>(ShowPost.this){
						@Override
						public void done(ParseObject favorite, ParseException ex) {
							super.done(favorite, ex);
							if(favorite==null){
								favorite=new ParseObject("favorite");
								favorite.put("owner", ParseUser.getCurrentUser());
								favorite.put("post", post);
								favorite.put("title", post.getString("title"));
								if(favorite.containsKey("thumb"))
									favorite.put("thumb", post.getParseFile("thumb"));
								favorite.saveEventually();
								starAction.getDrawable().setColorFilter(new LightingColorFilter(Color.BLACK,Color.YELLOW));
							}else{
								favorite.deleteEventually();
							}
						}
						
					});
					break;
				case 1://share to media, wb and wc
					
					break;
				case 4://plan
					getPlanWindow().showAsDropDown(footer.getItem(position).getItemView());
					plan(new OnGet<ParseObject>(ShowPost.this){
						@Override
						public void done(ParseObject task, ParseException ex) {
							super.done(task,ex);
							if(task!=null)
								planTypes.check(task.getInt("type"));
						}
						
					} );
					break;
				case 2://story
					Intent intent2=new Intent(ShowPost.this,CreateStory.class);
					intent2.putExtra("parent", ID);
					intent2.putExtra("type","story");
					startActivity(intent2);
					break;
				}
				
			}
			
		});
		
		this.getActionBar().setOnActionBarListener(new OnActionBarListener(){

			@Override
			public void onActionBarItemClicked(int position) {
				switch(position){
				case OnActionBarListener.HOME_ITEM:
					onBackPressed();
					break;
				case 0:
					refresh();
					break;
				default:
					
					break;
				}
				
			}
			
		});
		
		refresh();	
	}
	
	public void refresh(){
		post.fetchInBackground(new OnGet<ParseObject>(this){
			@Override
			public void done(ParseObject p, ParseException ex) {
				super.done(p, ex);
				if(p==null)
					return;
				setTitle(p.getString("title"));
				URLImageParser imageGetter = new URLImageParser(vContent, ShowPost.this);
				vContent.setText(Html.fromHtml("<div>"+p.getString("content")+"</div>",imageGetter,null));
				
				favorite(new OnGet<ParseObject>(ShowPost.this){
					@Override
					public void done(ParseObject f, ParseException ex) {
						super.done(f, ex);
						if(f!=null)
							starAction.getDrawable().setColorFilter(new LightingColorFilter(Color.BLACK,Color.YELLOW));
						refreshAction.setLoading(false);
					}
					
				});
				
				
				plan(new OnGet<ParseObject>(ShowPost.this){
					@Override
					public void done(ParseObject task, ParseException ex) {
						super.done(task, ex);
						if(task!=null)
							planAction.getDrawable().setColorFilter(new LightingColorFilter(Color.BLACK,Color.YELLOW));
						refreshAction.setLoading(false);
					}
				});	
				
				ListView vStories=(ListView)findViewById(R.id.stories);
				QueryAdapter<ParseObject> adapter=new QueryAdapter<ParseObject>(ShowPost.this, new QueryFactory<ParseObject>(){
					@Override
					public ParseQuery<ParseObject> create() {
						Query<ParseObject> query=new Query<ParseObject>("story");
						query.whereEqualTo("parent", ParseObject.createWithoutData("post", ID));
						return query;
					}
				});
				adapter.setTextKey("content");
				adapter.setImageKey("thumbnail");
				vStories.setAdapter(adapter);
			}	
		});
	}
	
	public void favorite(GetCallback<ParseObject> callback){
		Query<ParseObject> query=new Query<ParseObject>("favorite");
		query.whereEqualTo("owner", ParseUser.getCurrentUser());
		query.whereEqualTo("post", post);
		query.getFirstInBackground(callback);
	}
	
	public void plan(GetCallback<ParseObject> callback){
		Query<ParseObject> query=new Query<ParseObject>("task");
		query.whereEqualTo("owner", ParseUser.getCurrentUser());
		query.whereEqualTo("post", post);
		query.getFirstInBackground(callback);
	}
	
	private PopupWindow planWindow;
	protected PopupWindow getPlanWindow(){
		if(planWindow==null){
			LayoutInflater inflater=(LayoutInflater)this.getSystemService(Context.LAYOUT_INFLATER_SERVICE);
			View view=inflater.inflate(R.layout.plan_type, null);
			planWindow=new PopupWindow(view,200,600);
			planTypes = (RadioGroup) view.findViewById(R.id.planType);
			planTypes.setOnCheckedChangeListener(new OnCheckedChangeListener() {
			      public void onCheckedChanged (RadioGroup group, final int checkedId) {
			    	  RadioButton type=(RadioButton)group.findViewById(checkedId);
			    	  if(type.isChecked()){
			    		  plan(new OnGet<ParseObject>(ShowPost.this){

							@Override
							public void done(ParseObject task,
									ParseException ex) {
								super.done(task, ex);
								if(checkedId==0){
									if(task!=null)
										task.deleteEventually();
								}else{ 
									if(task==null){
										task=new ParseObject("task");
										task.put("owner", ParseUser.getCurrentUser());
										task.put("post", post);
										if(post.containsKey("thumb"))
											task.put("thumb", post.getParseFile("thumb"));
										task.put("title", post.getString("title"));
									}
									task.put("planAt", new Date());
									task.put("type", checkedId);
									task.saveEventually();									
								}
									
							}
			    			  
			    		  });
			    	  }
			    	  planWindow.dismiss();
			      }
			});
		}
		planWindow.setFocusable(true);
		planWindow.setOutsideTouchable(true);
		planWindow.setBackgroundDrawable(new BitmapDrawable()); 
		return planWindow;
	}
	
	private static class URLDrawable extends BitmapDrawable {
	    protected Drawable drawable;

	    @Override
	    public void draw(Canvas canvas) {
	        if(drawable != null) {
	            drawable.draw(canvas);
	        }
	    }
	}
	
	private static class URLImageParser implements Html.ImageGetter {
	    Context c;
	    View container;

	    /***
	     * Construct the URLImageParser which will execute AsyncTask and refresh the container
	     * @param t
	     * @param c
	     */
	    public URLImageParser(View t, Context c) {
	        this.c = c;
	        this.container = t;
	    }

	    public Drawable getDrawable(String source) {
	        URLDrawable urlDrawable = new URLDrawable();

	        // get the actual source
	        ImageGetterAsyncTask asyncTask = 
	            new ImageGetterAsyncTask( urlDrawable);

	        asyncTask.execute(source);

	        // return reference to URLDrawable where I will change with actual image from
	        // the src tag
	        return urlDrawable;
	    }

	    public class ImageGetterAsyncTask extends AsyncTask<String, Void, Drawable>  {
	        URLDrawable urlDrawable;

	        public ImageGetterAsyncTask(URLDrawable d) {
	            this.urlDrawable = d;
	        }

	        @Override
	        protected Drawable doInBackground(String... params) {
	            String source = params[0];
	            return fetchDrawable(source);
	        }

	        @Override
	        protected void onPostExecute(Drawable result) {
	            // set the correct bound according to the result from HTTP call
	            urlDrawable.setBounds(0, 0, 0 + result.getIntrinsicWidth(), 0 
	                    + result.getIntrinsicHeight()); 

	            // change the reference of the current drawable to the result
	            // from the HTTP call
	            urlDrawable.drawable = result;

	            // redraw the image by invalidating the container
	            URLImageParser.this.container.invalidate();
	        }

	        /***
	         * Get the Drawable from URL
	         * @param urlString
	         * @return
	         */
	        public Drawable fetchDrawable(String urlString) {
	            try {
	                InputStream is = fetch(urlString);
	                Drawable drawable = Drawable.createFromStream(is, "src");
	                drawable.setBounds(0, 0, 0 + drawable.getIntrinsicWidth(), 0 
	                        + drawable.getIntrinsicHeight()); 
	                return drawable;
	            } catch (Exception e) {
	                return null;
	            } 
	        }

	        private InputStream fetch(String urlString) throws MalformedURLException, IOException {
	            DefaultHttpClient httpClient = new DefaultHttpClient();
	            HttpGet request = new HttpGet(urlString);
	            HttpResponse response = httpClient.execute(request);
	            return response.getEntity().getContent();
	        }
	    }
	}
}
