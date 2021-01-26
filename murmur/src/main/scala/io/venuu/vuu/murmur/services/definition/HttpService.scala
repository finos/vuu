/**
 * Copyright Whitebox Software Ltd. 2014
 * All Rights Reserved.
 *
 * Created by chris on 16/06/2020.
 *
 */
package io.venuu.vuu.murmur.services.definition

import io.venuu.vuu.murmur.model.{Host, ModelConfig}

trait HttpService {
  def downloadDeploy(path: String, model: ModelConfig): Boolean
}
