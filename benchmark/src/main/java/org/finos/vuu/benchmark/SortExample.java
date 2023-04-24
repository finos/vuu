package org.finos.vuu.benchmark;

import java.util.Arrays;
import java.util.Comparator;
import java.util.Random;

public class SortExample {

    private static void print(Object[][] arr){
        for(int c=0; c<arr.length; c++){
            Object[] row = arr[c];
            System.out.println(row[0] + "," + row[1] + "," + row[2]);
        }
    }

    public static void main(String[] args){

        int size = 10_000_000;

        Object[][] values = new Object[size][3];

        int i = 0;

        Random rand = new Random();

        for(int c=0; c < size; c++){
            values[c][0] = "c" + c;
            values[c][1] = rand.nextInt(3);
            values[c][2] = rand.nextInt(3);
        }



        Arrays.sort(values, new Comparator<Object[]>() {
            @Override
            public int compare(Object[] o1, Object[] o2) {
                int res = 0;

                int i1 = (int)o1[1];
                int i2 = (int)o2[1];

                int i3 = (int)o1[2];
                int i4 = (int)o2[2];

                if(i1 < i2){
                    res = -1;
                }else if(i2 < i1){
                    res = 1;
                }else {
                    if(i3 < i4){
                        res = -1;
                    }else if(i4 < i3){
                        res = 1;
                    }
                }

                return res;
            }
        });

        //print(values);
    }



}
