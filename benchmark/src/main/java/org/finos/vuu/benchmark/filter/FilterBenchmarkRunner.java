package org.finos.vuu.benchmark.filter;

import org.finos.vuu.benchmark.BenchmarkHelper;
import org.openjdk.jmh.annotations.*;
import org.openjdk.jmh.infra.Blackhole;

import java.util.concurrent.TimeUnit;

@State(Scope.Benchmark)
public class FilterBenchmarkRunner {

    private final BenchmarkHelper benchmarkHelper = new BenchmarkHelper();
    private FilterBenchmark benchmark;

    @Param({ "1000000" })
    public int tableSize;

    @Setup(Level.Trial)
    public void setup() {
        benchmark = new FilterBenchmark(benchmarkHelper, tableSize);
    }

    //@Benchmark
    @OutputTimeUnit(TimeUnit.MICROSECONDS)
    @Warmup(iterations = 5)
    @Measurement(iterations = 5)
    @Fork(1)
    @BenchmarkMode(Mode.SampleTime)
    public void equalsFilter(Blackhole bh) {
        benchmark.equalsFilter(bh);
    }

    //@Benchmark
    @OutputTimeUnit(TimeUnit.MILLISECONDS)
    @Warmup(iterations = 5)
    @Measurement(iterations = 5)
    @Fork(1)
    @BenchmarkMode(Mode.SampleTime)
    public void startsWithFilter(Blackhole bh) {
        benchmark.startsWithFilter(bh);
    }

    //@Benchmark
    @OutputTimeUnit(TimeUnit.MILLISECONDS)
    @Warmup(iterations = 5)
    @Measurement(iterations = 5)
    @Fork(1)
    @BenchmarkMode(Mode.SampleTime)
    public void lessThanFilter(Blackhole bh) {
        benchmark.lessThanFilter(bh);
    }

}


