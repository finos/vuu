package test.helper;

import java.util.HashMap;
import java.util.List;
import java.util.Optional;

public class FakeDataSource {

    private HashMap<String, List<List<Object>>> queryToValuesResultMap = new HashMap<>();

    public void setUpResultAsListOfValues(String queryName, List<List<Object>> resultValues) {
        queryToValuesResultMap.put(queryName, resultValues);
    }

    public Optional<List<List<Object>>> getAsListOfValues(String queryName) {
        return queryToValuesResultMap.containsKey(queryName)
                ? Optional.of(queryToValuesResultMap.get(queryName))
                : Optional.empty();
    }
}
