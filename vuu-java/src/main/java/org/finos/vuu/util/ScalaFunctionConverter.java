package org.finos.vuu.util;

import scala.Function2;

import java.util.function.BiFunction;

public class ScalaFunctionConverter {

    public static <T,U,R> Function2<T,U,R> toScala(BiFunction<T,U,R> function) {
        return function::apply;
    }

}
