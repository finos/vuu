package org.finos.vuu.layoutserver.dto.request;

import com.fasterxml.jackson.annotation.JsonUnwrapped;
import javax.validation.Valid;
import lombok.Data;
import org.finos.vuu.layoutserver.model.BaseMetadata;

@Data
public class MetadataRequestDto {

    @JsonUnwrapped
    @Valid
    BaseMetadata baseMetadata;
}
