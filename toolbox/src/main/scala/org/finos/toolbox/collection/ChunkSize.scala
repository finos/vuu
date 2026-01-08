package org.finos.toolbox.collection

object ChunkSize {

  def from(hint: Int): Int = {
    hint match
      case h if h < 100_000 => 5_000
      case h if h < 9_000_000 => 50_000
      case _ => 100_000
  }
  
}
