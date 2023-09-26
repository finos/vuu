package org.finos.vuu.layoutserver.dto.request;

import lombok.Data;
import org.finos.vuu.layoutserver.model.Layout;

import java.io.Serializable;

@Data
public class LayoutRequestDTO implements Serializable {

    private String definition;
    private MetadataRequestDTO metadata;

    public Layout toEntity() {
        Layout layout = new Layout();
        layout.setDefinition(definition);
        layout.setMetadata(metadata.toEntity());
        return layout;
    }
}
