package org.finos.vuu.layoutserver.dto.response;

import com.fasterxml.jackson.annotation.JsonUnwrapped;
import java.util.Date;
import java.util.UUID;
import lombok.Data;
import org.finos.vuu.layoutserver.model.BaseMetadata;

@Data
public class MetadataResponseDTO {

    private UUID layoutId;

    @JsonUnwrapped
    BaseMetadata baseMetadata;

    private Date created;
    private Date updated;
}
