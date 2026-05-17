package org.finos.vuu.benchmark.table;

import org.finos.vuu.benchmark.BenchmarkHelper;
import org.openjdk.jmh.annotations.*;

import java.io.IOException;
import java.util.concurrent.TimeUnit;

@State(Scope.Thread)
public class InMemDataTableEmptyBenchmarkRunner {

    private final BenchmarkHelper benchmarkHelper = new BenchmarkHelper();
    private InMemDataTableBenchmark benchmark;

    @Param({ "50000", "250000", "500000" })
    public int insertSize;

    @Setup(Level.Invocation)
    public void setup() {
        benchmark = new InMemDataTableBenchmark(benchmarkHelper);
    }

    //@Benchmark
    @OutputTimeUnit(TimeUnit.MILLISECONDS)
    @Warmup(iterations = 5)
    @Measurement(iterations = 5)
    @Fork(1)
    @BenchmarkMode(Mode.SampleTime)
    public void addRows() throws IOException {
        benchmark.addRows(insertSize);
    }

}
