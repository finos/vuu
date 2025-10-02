package org.finos.vuu.util;

import org.junit.Test;
import scala.collection.Seq;

import java.util.List;
import java.util.Map;

import static org.junit.Assert.assertEquals;

public class ScalaCollectionConverterTest {

    @Test
    public void testEmptySeq() {
        Seq<String> empty = ScalaCollectionConverter.emptySeq();

        assertEquals(0, empty.size());
    }

    @Test
    public void testToScalaSeq() {
        Seq<String> seq = ScalaCollectionConverter.toScalaSeq(List.of("Mikey"));

        assertEquals(1, seq.size());
        assertEquals("Mikey", seq.head());
    }

    @Test
    public void testEmptyList() {
        scala.collection.immutable.List<String> empty = ScalaCollectionConverter.emptyList();

        assertEquals(0, empty.size());
    }

    @Test
    public void testToScalaList() {
        scala.collection.immutable.List<String> list = ScalaCollectionConverter.toScala(List.of("Mikey"));

        assertEquals(1, list.size());
        assertEquals("Mikey", list.head());
    }

    @Test
    public void testEmptyIterable() {
        scala.collection.immutable.Iterable<String> empty = ScalaCollectionConverter.emptyIterable();

        assertEquals(0, empty.size());
    }

    @Test
    public void testToScalaIterable() {
        scala.collection.Iterable<String> iterable = ScalaCollectionConverter.toScala((Iterable<String>)List.of("Mikey"));

        assertEquals(1, iterable.size());
        assertEquals("Mikey", iterable.head());
    }

    @Test
    public void testEmptyMap() {
        scala.collection.immutable.Map<String, Integer> empty = ScalaCollectionConverter.emptyMap();

        assertEquals(0, empty.size());
    }

    @Test
    public void testToScalaMap() {
        scala.collection.immutable.Map<String, Integer> map = ScalaCollectionConverter.toScala(Map.of("Mikey", 100));

        assertEquals(1, map.size());
        assertEquals(100, map.get("Mikey").get().intValue());
    }

}
