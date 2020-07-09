/**
 * Copyright Whitebox Software Ltd. 2014
 * All Rights Reserved.
 *
 * Created by chris on 07/05/2020.
 *
 */
package io.venuu.vuu.murmur.services.definition

import java.nio.file.Path

import io.venuu.toolbox.lifecycle.DefaultLifecycleEnabled
import monix.reactive.Observable

trait FileSystemService extends DefaultLifecycleEnabled {
  def deployObservable: Observable[Path]
  def unzip(path: Path): Boolean
  def versionObservable: Observable[Path]
  def deployExists(path: Path): Boolean
}
