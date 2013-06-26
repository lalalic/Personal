package greendroid.widget;

import greendroid.app.GDActivity;
import android.app.Activity;
import android.content.Context;
import android.util.AttributeSet;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.view.WindowManager;
import android.widget.ImageView;
import android.widget.LinearLayout;

import com.cyrilmottier.android.greendroid.R;

public class ToolBar extends ActionBar {
	int mItemWidth;
	public ToolBar(Context context) {
        this(context, null);
    }

    public ToolBar(Context context, AttributeSet attrs) {
        this(context, attrs, R.attr.gdActionBarStyle);
    }
	public ToolBar(Context context, AttributeSet attrs, int defStyle) {
		super(context, attrs, defStyle);
		this.setType(Type.Dashboard);
		setMaxItemCount(this.mMaxItemsCount);
	}
	
	public void setMaxItemCount(int count){ 
		this.mMaxItemsCount=count;
		if(this.mDividerWidth<=0 && this.mDividerDrawable!=null)
			this.mDividerWidth=mDividerDrawable.getIntrinsicWidth();
		
		int screenWidth=((WindowManager)this.getContext().getSystemService(Context.WINDOW_SERVICE)).getDefaultDisplay().getWidth();
		int size=(screenWidth-(this.mMaxItemsCount-1)*this.mDividerWidth)/this.mMaxItemsCount;
		mItemWidth = (int) getResources().getDimension(R.dimen.gd_action_bar_height);
		if(size>mItemWidth)
			mItemWidth=size;
		if(this.mItems.size()>0)
			this.setType(Type.Dashboard);
	}

	@Override
	public ActionBarItem addItem(ActionBarItem item, int itemId) {

        if (mItems.size() >= mMaxItemsCount) {
            /*
             * An ActionBar must contain as few items as possible. So let's keep
             * a limit :)
             */
            return null;
        }

        if (item != null) {

            item.setItemId(itemId);

            if (mDividerDrawable != null && mItems.size()>0) {
                ImageView divider = new ImageView(getContext());
                final LinearLayout.LayoutParams lp = new LayoutParams(mDividerWidth, LayoutParams.FILL_PARENT);
                divider.setLayoutParams(lp);
                divider.setBackgroundDrawable(mDividerDrawable);
                addView(divider);
            }

            final View itemView = item.getItemView();
            itemView.findViewById(R.id.gd_action_bar_item).setOnClickListener(mClickHandler);

            addView(itemView, new LayoutParams(this.mItemWidth, LayoutParams.FILL_PARENT));

            mItems.add(item);
        }

        return item;
    }
	
	public static ToolBar inflate(Activity activity,ViewGroup parent){
		LayoutInflater.from(activity).inflate(R.layout.gd_footer, parent);
		return (ToolBar)activity.findViewById(R.id.footer);
	}
	
	public static ToolBar inflate(GDActivity activity){
		return inflate(activity,(ViewGroup)activity.getActionBar().getParent());
	}
}
