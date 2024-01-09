package org.finos.vuu.layoutserver.dto.response;

import com.fasterxml.jackson.databind.node.ObjectNode;
import lombok.Data;

@Data
public class ApplicationLayoutDto {
    private ObjectNode applicationLayout;
    private ObjectNode settings;
}
