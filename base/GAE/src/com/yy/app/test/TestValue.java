package com.yy.app.test;

import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

@Retention(RetentionPolicy.RUNTIME)
@Target(ElementType.PARAMETER)
public @interface TestValue {
	String value() default "";
	String field() default "";
	String[] values() default {};
	Class<?> model() default(Object.class);
	String note() default "";
}
