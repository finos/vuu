package org.finos.vuu.toolbox;


import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertArrayEquals;

class UtilsTest {

    @Test
    void combineStringArrays() {
        String[] a = {"A", "B"};
        String[] b = {"C", "D"};

        String[] result = Utils.combine(a, b);

        assertArrayEquals(new String[]{"A", "B", "C", "D"}, result);
    }

    @Test
    void combineIntegerArrays() {
        Integer[] a = {1, 2};
        Integer[] b = {3, 4};

        Integer[] result = Utils.combine(a, b);

        assertArrayEquals(new Integer[]{1, 2, 3, 4}, result);
    }
}