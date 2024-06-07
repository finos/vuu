package org.finos.vuu.util;

import scala.jdk.CollectionConverters;

import java.util.List;
import java.util.Map;

public class ScalaCollectionConverter {

    public static <K, V> scala.collection.immutable.Map<K, V> toScala(Map<K, V> m) {
        return scala.collection.immutable.Map.from(scala.jdk.CollectionConverters.MapHasAsScala(m).asScala());
    }

    public static <T> scala.collection.Iterable<T> toScala(Iterable<T> l) {
        return CollectionConverters.IterableHasAsScala(l).asScala();
    }

    public static <T> scala.collection.immutable.List<T> toScala(List<T> l) {
        return CollectionConverters.IterableHasAsScala(l).asScala().toList();
    }

    public static <T> scala.collection.immutable.Seq<T> toScalaSeq(List<T> l) {
        return CollectionConverters.IterableHasAsScala(l).asScala().toSeq();
    }

    public static <T> List<T> toJava(scala.collection.immutable.List<T> l) {
        return CollectionConverters.SeqHasAsJava(l).asJava();
    }
}

