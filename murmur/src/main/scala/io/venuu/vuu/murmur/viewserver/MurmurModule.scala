/**
 * Copyright Whitebox Software Ltd. 2014
 * All Rights Reserved.
 *
 * Created by chris on 19/06/2020.
 *
 */
package io.venuu.vuu.murmur.viewserver

import java.nio.file.Path

import io.venuu.vuu.core.module.{ModuleFactory, ViewServerModule}

object MurmurModule{

  final val NAME = "MURMUR"

  def apply(deployDirectoryPath: Path): ViewServerModule = {

    ModuleFactory.withNamespace(NAME)
      .addStaticResource("/app/murmur/deploy", deployDirectoryPath, true)
      .asModule()

  }

}
