package org.finos.vuu.util;

import java.util.Arrays;

import static org.finos.vuu.util.ScalaCollectionConverter.toScala;

public class ScalaList {
    public static <T> scala.collection.Iterable<T> of(T... args) {
        return toScala(Arrays.asList(args));
    }
}
