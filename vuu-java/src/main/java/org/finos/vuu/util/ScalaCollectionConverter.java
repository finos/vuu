package org.finos.vuu.util;

import scala.collection.immutable.List$;
import scala.collection.immutable.Map$;
import scala.collection.immutable.Set$;

import java.util.List;
import java.util.Map;
import java.util.Set;

import static scala.jdk.CollectionConverters.IterableHasAsScala;
import static scala.jdk.CollectionConverters.MapHasAsJava;
import static scala.jdk.CollectionConverters.MapHasAsScala;
import static scala.jdk.CollectionConverters.SeqHasAsJava;
import static scala.jdk.CollectionConverters.SetHasAsJava;

public class ScalaCollectionConverter {

    private ScalaCollectionConverter() { }

    public static <K, V> scala.collection.immutable.Map<K, V> emptyMap() {
        return Map$.MODULE$.empty();
    }

    public static <K, V> scala.collection.immutable.Map<K, V> toScala(Map<K, V> m) {
        return scala.collection.immutable.Map.from(MapHasAsScala(m).asScala());
    }

    public static <T> scala.collection.immutable.Iterable<T> emptyIterable() {
        return emptyList();
    }

    public static <T> scala.collection.immutable.Iterable<T> toScala(Iterable<T> l) {
        return IterableHasAsScala(l).asScala().toList();
    }

    public static <T> scala.collection.immutable.List<T> emptyList() {
        return List$.MODULE$.empty();
    }

    public static <T> scala.collection.immutable.List<T> toScala(List<T> l) {
        return IterableHasAsScala(l).asScala().toList();
    }

    public static <T> scala.collection.immutable.Seq<T> emptySeq() {
        return emptyList();
    }

    public static <T> scala.collection.immutable.Seq<T> toScalaSeq(List<T> l) {
        return toScala(l);
    }

    public static <T> scala.collection.immutable.Set<T> emptySet() {
        return Set$.MODULE$.empty();
    }

    public static <T> scala.collection.immutable.Set<T> toScala(Set<T> l) {
        return IterableHasAsScala(l).asScala().toSet();
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

