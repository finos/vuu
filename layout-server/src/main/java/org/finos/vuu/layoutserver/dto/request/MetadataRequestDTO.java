package org.finos.vuu.layoutserver.dto.request;

import com.fasterxml.jackson.annotation.JsonUnwrapped;
import lombok.Data;
import org.finos.vuu.layoutserver.model.BaseMetadata;

@Data
public class MetadataRequestDTO {

    @JsonUnwrapped
    BaseMetadata baseMetadata;
}
