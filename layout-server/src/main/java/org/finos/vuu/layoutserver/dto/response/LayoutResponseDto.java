package org.finos.vuu.layoutserver.dto.response;

import com.fasterxml.jackson.databind.node.ObjectNode;
import lombok.Data;
import org.finos.vuu.layoutserver.utils.ObjectNodeConverter;

import javax.persistence.Column;
import javax.persistence.Convert;
import java.util.UUID;

@Data
public class LayoutResponseDto {

    private UUID id;
    private ObjectNode definition;

    private MetadataResponseDto metadata;
}
