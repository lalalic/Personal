package com.yy.app.test;

import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

@Retention(RetentionPolicy.RUNTIME)
@Target(ElementType.METHOD)
public @interface Test {
	String[] value() default {};//primitive types, or .fieldName of model tester instance
	String urlExtra() default "";//matrix+querys
	Class<?> model() default Object.class;
	boolean removeTester() default false; //whether remove tester instance first
	String[] patterns() default {};
	String note() default "";
	PathIs IF() default @PathIs; 
}
