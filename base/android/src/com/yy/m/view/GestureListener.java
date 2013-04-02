package com.yy.m.view;

import android.content.Context;
import android.view.GestureDetector.OnGestureListener;
import android.view.MotionEvent;
import android.view.animation.AnimationUtils;
import android.widget.ViewFlipper;

import com.yy.m.R;

public class GestureListener implements OnGestureListener {
	private static final int FLING_MIN_DISTANCE = 100;
	
	private ViewFlipper flipper;
	private Context ctx;
	private OnPageChangeListener pageChangeListener;
	public GestureListener(ViewFlipper flipper, OnPageChangeListener pageChangeListener){
		this.flipper=flipper;
		this.ctx=flipper.getContext();
		this.pageChangeListener=pageChangeListener;
	}
	@Override
	public boolean onDown(MotionEvent arg0) {
		return false;
	}

	@Override
	public boolean onFling(MotionEvent e1, MotionEvent e2,
			float velocityX, float velocityY) {
		if (e1.getX() - e2.getX() > FLING_MIN_DISTANCE) {
			flipper.setInAnimation(AnimationUtils.loadAnimation(
					ctx, R.anim.left_in));
			flipper.setOutAnimation(AnimationUtils.loadAnimation(
					ctx, R.anim.left_out));
			flipper.showNext();
			if(this.pageChangeListener!=null)
				this.pageChangeListener.onPageChange(flipper.getCurrentView());
			return true;
		}
		if (e1.getX() - e2.getX() < -FLING_MIN_DISTANCE) {
			flipper.setInAnimation(AnimationUtils.loadAnimation(
					ctx, R.anim.right_in));
			flipper.setOutAnimation(AnimationUtils.loadAnimation(
					ctx, R.anim.right_out));
			flipper.showPrevious();
			if(this.pageChangeListener!=null)
				this.pageChangeListener.onPageChange(flipper.getCurrentView());
			return true;
		}
		return false;
	}

	@Override
	public void onLongPress(MotionEvent arg0) {

	}

	@Override
	public boolean onScroll(MotionEvent arg0, MotionEvent arg1,
			float arg2, float arg3) {
		return false;
	}

	@Override
	public void onShowPress(MotionEvent arg0) {
	}

	@Override
	public boolean onSingleTapUp(MotionEvent arg0) {
		return false;
	}
}
