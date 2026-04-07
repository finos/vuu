package org.finos.vuu.net.json.mixin

import com.fasterxml.jackson.annotation.JsonSubTypes.Type
import com.fasterxml.jackson.annotation.{JsonSubTypes, JsonTypeInfo}
import org.finos.vuu.net.ui.{NoneAction, ShowNotificationAction}

@JsonTypeInfo(
  use = JsonTypeInfo.Id.NAME,
  include = JsonTypeInfo.As.PROPERTY,
  property = "type"
)
@JsonSubTypes(Array(
  new Type(value = classOf[NoneAction.type], name = "NONE_ACTION"),
  new Type(value = classOf[ShowNotificationAction], name = "SHOW_NOTIFICATION_ACTION")
))
trait UIActionMixin { }
