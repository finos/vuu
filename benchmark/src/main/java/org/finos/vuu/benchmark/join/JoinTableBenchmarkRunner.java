package org.finos.vuu.benchmark.join;

import org.finos.vuu.benchmark.BenchmarkHelper;
import org.openjdk.jmh.annotations.*;
import org.openjdk.jmh.infra.Blackhole;

import java.util.concurrent.TimeUnit;

@State(Scope.Thread)
public class JoinTableBenchmarkRunner {

    private final BenchmarkHelper benchmarkHelper = new BenchmarkHelper();
    private JoinTableBenchmark benchmark;

    @Param({ "10000", "100000", "1000000" })
    public int insertSize;

    @Setup(Level.Trial)
    public void setup() {
        benchmark = new JoinTableBenchmark(benchmarkHelper);
        benchmark.addRows(insertSize);
    }

    //@Benchmark
    @OutputTimeUnit(TimeUnit.MILLISECONDS)
    @Warmup(iterations = 5)
    @Measurement(iterations = 5)
    @Fork(1)
    @BenchmarkMode(Mode.SampleTime)
    public void iterateRows(Blackhole bh) {
        benchmark.iterateRows(bh);
    }

}
