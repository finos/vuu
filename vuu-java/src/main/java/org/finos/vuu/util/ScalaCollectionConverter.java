package org.finos.vuu.util;

import java.util.List;
import java.util.Map;
import java.util.Set;

import static scala.jdk.CollectionConverters.*;

public class ScalaCollectionConverter {

    private ScalaCollectionConverter() { }

    public static <K, V> scala.collection.immutable.Map<K, V> emptyMap() {
        return toScala(Map.of());
    }

    public static <K, V> scala.collection.immutable.Map<K, V> toScala(Map<K, V> m) {
        return scala.collection.immutable.Map.from(MapHasAsScala(m).asScala());
    }

    public static <T> scala.collection.immutable.Iterable<T> emptyIterable() {
        return toScala(List.of());
    }

    public static <T> scala.collection.Iterable<T> toScala(Iterable<T> l) {
        return IterableHasAsScala(l).asScala();
    }

    public static <T> scala.collection.immutable.List<T> emptyList() {
        return toScala(List.of());
    }

    public static <T> scala.collection.immutable.List<T> toScala(List<T> l) {
        return IterableHasAsScala(l).asScala().toList();
    }

    public static <T> scala.collection.immutable.Seq<T> emptySeq() {
        return toScalaSeq(List.of());
    }

    public static <T> scala.collection.immutable.Seq<T> toScalaSeq(List<T> l) {
        return IterableHasAsScala(l).asScala().toSeq();
    }

    public static <T> List<T> toJava(scala.collection.immutable.List<T> l) {
        return SeqHasAsJava(l).asJava();
    }

    public static <T> Set<T> toJava(scala.collection.immutable.Set<T> l) {
        return SetHasAsJava(l).asJava();
    }

    public static <K,V> Map<K,V> toJava(scala.collection.immutable.Map<K,V> l) {
        return MapHasAsJava(l).asJava();
    }

}

