package org.finos.vuu.layoutserver.dto.response;

import lombok.Builder;
import lombok.Data;
import org.finos.vuu.layoutserver.model.Layout;

import java.io.Serializable;
import java.util.UUID;

@Data
@Builder
public class LayoutResponseDTO implements Serializable {

    private UUID id;
    private String definition;
    private MetadataResponseDTO metadata;

    public static LayoutResponseDTO fromEntity(Layout layout) {
        return LayoutResponseDTO.builder().id(layout.getId()).definition(layout.getDefinition()).metadata(MetadataResponseDTO.fromEntity(layout.getMetadata())).build();
    }
}
