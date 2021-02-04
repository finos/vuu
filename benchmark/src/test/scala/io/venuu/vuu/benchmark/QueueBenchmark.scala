package io.venuu.vuu.benchmark

import org.openjdk.jmh.annotations.Benchmark
import org.scalatest.{FeatureSpec, Matchers}

class QueueBenchmark extends FeatureSpec with Matchers {

  feature("test"){
    scenario("test2"){

      val argv = Array[String]()

      org.openjdk.jmh.Main.main(argv)

    }

  }

  @Benchmark
  def runSimpleBenchmark(): Unit ={

    (1 to 10000).foreach( i => Math.asin(i))

  }

}
