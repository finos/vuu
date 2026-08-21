package org.finos.vuu.util;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;

import org.finos.vuu.core.table.RowData;
import org.finos.vuu.core.table.RowWithData;
import org.finos.vuu.core.table.util.RowDataUtils;
import org.junit.jupiter.api.Test;
import scala.runtime.RichLong;

import java.util.Map;

class RowDataUtilsJavaTest {
    Map<String, Object> data = Map.of(
            "long", 123L,
            "Long", Long.valueOf(456L),
            "RichLong", new RichLong(789L)
    );
    RowData rowData = new RowWithData("myKey", ScalaCollectionConverter.toScala(data));

    @Test
    void shouldReturnLongWhenValueIsPrimitiveLong() {
        long result = RowDataUtils.getRequiredLong(rowData, "long");
        assertEquals(123L, result);
    }

    @Test
    void shouldReturnLongWhenValueIsLong() {
        long result = RowDataUtils.getRequiredLong(rowData, "Long");
        assertEquals(456L, result);
    }

    @Test
    void shouldReturnLongWhenValueIsRichLong() {
        long result = RowDataUtils.getRequiredLong(rowData, "RichLong");
        assertEquals(789L, result);
    }

    @Test
    void shouldThrowExceptionWhenValueIsNull() {
        assertThrows(
                RowDataUtils.RowDataException.class,
                () -> RowDataUtils.getRequiredLong(rowData, "null")
        );
    }
}