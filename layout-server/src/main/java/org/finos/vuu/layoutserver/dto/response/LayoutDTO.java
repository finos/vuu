package org.finos.vuu.layoutserver.dto.response;

import lombok.Builder;
import lombok.Data;
import org.finos.vuu.layoutserver.model.Layout;

import java.io.Serializable;

@Data
@Builder
public class LayoutDTO implements Serializable {

    private String id;
    private String definition;
    private MetadataDTO metadata;

    public static LayoutDTO fromEntity(Layout layout) {
        return LayoutDTO.builder()
                .id(layout.getId())
                .definition(layout.getDefinition())
                .metadata(MetadataDTO.fromEntity(layout.getMetadata()))
                .build();
    }
}
