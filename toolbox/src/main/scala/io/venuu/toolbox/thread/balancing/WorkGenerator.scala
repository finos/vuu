package io.venuu.toolbox.thread.balancing

trait WorkGenerator[WORK] {
  def generate(): List[TimedWork[WORK]]
}
