package org.finos.vuu.benchmark.filter;

import org.finos.vuu.benchmark.BenchmarkHelper;
import org.openjdk.jmh.annotations.Benchmark;
import org.openjdk.jmh.annotations.BenchmarkMode;
import org.openjdk.jmh.annotations.Fork;
import org.openjdk.jmh.annotations.Level;
import org.openjdk.jmh.annotations.Measurement;
import org.openjdk.jmh.annotations.Mode;
import org.openjdk.jmh.annotations.OutputTimeUnit;
import org.openjdk.jmh.annotations.Param;
import org.openjdk.jmh.annotations.Scope;
import org.openjdk.jmh.annotations.Setup;
import org.openjdk.jmh.annotations.State;
import org.openjdk.jmh.annotations.Warmup;
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

    @Benchmark
    @OutputTimeUnit(TimeUnit.MILLISECONDS)
    @Warmup(iterations = 5)
    @Measurement(iterations = 5)
    @Fork(1)
    @BenchmarkMode(Mode.SampleTime)
    public void startsWithFilter(Blackhole bh) {
        benchmark.startsWithFilter(bh);
    }

}


