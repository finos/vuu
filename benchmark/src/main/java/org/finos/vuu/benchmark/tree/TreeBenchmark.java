package org.finos.vuu.benchmark.tree;

import org.finos.vuu.benchmark.BenchmarkHelper;
import org.finos.vuu.viewport.tree.TreeBuilder;

public class TreeBenchmark {

    private final TreeBuilder treeBuilder;

    public TreeBenchmark(BenchmarkHelper benchmarkHelper, int size) {
        benchmarkHelper.addPriceTableData(size);
        this.treeBuilder = benchmarkHelper.createTreeBuilder();
    }

    public void treeLargeTable() {
        treeBuilder.buildEntireTree();
    }
}
