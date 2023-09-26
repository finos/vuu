package org.finos.vuu.layoutserver.dto.request;

import lombok.Data;

@Data
public class LayoutRequestDTO {

    private String definition;
    private MetadataRequestDTO metadata;
}
