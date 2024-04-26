package org.finos.vuu.util.schema;

import org.finos.vuu.util.types.TypeConverter;
import org.junit.Test;

import static org.junit.Assert.assertEquals;

public class TypeConverterJavaTest {

    @Test
    public void test_quick_instantiation_through_TypeConverter_apply() {
        final var tc = TypeConverter.apply(String.class, Integer.class, Integer::parseInt);

        assertEquals(Integer.valueOf(20), tc.convert("20"));
        assertEquals(tc.name(), "java.lang.String->java.lang.Integer");
    }

    @Test
    public void test_instantiation_through_interface_implementation() {
        class MyTypeConverter implements TypeConverter<String, Double> {

            @Override
            public Class<String> fromClass() {
                return String.class;
            }

            @Override
            public Class<Double> toClass() {
                return double.class;
            }

            @Override
            public Double convert(String v) {
                return Double.valueOf(v);
            }
        }

        final var tc = new MyTypeConverter();

        assertEquals(Double.valueOf(20.56), tc.convert("20.56"));
        assertEquals(tc.name(), "java.lang.String->java.lang.Double");
    }
}
