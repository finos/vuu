package org.finos.vuu.benchmark.join;

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

    @Benchmark
    @OutputTimeUnit(TimeUnit.MILLISECONDS)
    @Warmup(iterations = 5)
    @Measurement(iterations = 5)
    @Fork(1)
    @BenchmarkMode(Mode.SampleTime)
    public void iterateRows(Blackhole bh) {
        benchmark.iterateRows(bh);
    }

}
