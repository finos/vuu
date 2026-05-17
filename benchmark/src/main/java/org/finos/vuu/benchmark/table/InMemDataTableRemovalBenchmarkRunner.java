package org.finos.vuu.benchmark.table;

import org.finos.vuu.benchmark.BenchmarkHelper;
import org.openjdk.jmh.annotations.*;

import java.io.IOException;
import java.util.concurrent.TimeUnit;

@State(Scope.Thread)
public class InMemDataTableRemovalBenchmarkRunner {

    private final BenchmarkHelper benchmarkHelper = new BenchmarkHelper();
    private InMemDataTableBenchmark benchmark;

    @Param({ "5000", "50000", "100000" })
    public int insertSize;

    @Setup(Level.Invocation)
    public void setup() {
        benchmark = new InMemDataTableBenchmark(benchmarkHelper);
        benchmark.addRows(insertSize);
    }

    //@Benchmark
    @OutputTimeUnit(TimeUnit.MILLISECONDS)
    @Warmup(iterations = 5)
    @Measurement(iterations = 5)
    @Fork(1)
    @BenchmarkMode(Mode.SampleTime)
    public void removeRows() throws IOException {
        benchmark.removeRows(insertSize);
    }

}
