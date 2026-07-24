package org.finos.vuu.toolbox;

import java.util.Arrays;

public class Utils {
    public static <T> T[] combine(T[] a, T[] b) {
        T[] result = Arrays.copyOf(a, a.length + b.length);
        System.arraycopy(b, 0, result, a.length, b.length);
        return result;
    }
}
