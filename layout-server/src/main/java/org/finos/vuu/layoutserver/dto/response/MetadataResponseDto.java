package org.finos.vuu.layoutserver.dto.response;

import com.fasterxml.jackson.annotation.JsonUnwrapped;
import lombok.Data;
import org.finos.vuu.layoutserver.model.BaseMetadata;

import java.time.LocalDate;
import java.util.UUID;

@Data
public class MetadataResponseDto {

    private UUID layoutId;

    @JsonUnwrapped
    BaseMetadata baseMetadata;

    private LocalDate created;
    private LocalDate updated;
}
