package org.finos.vuu.layoutserver.dto.response;

import lombok.Builder;
import lombok.Data;
import org.finos.vuu.layoutserver.model.Metadata;

import java.io.Serializable;
import java.util.Date;
import java.util.UUID;

@Data
@Builder
public class MetadataResponseDTO implements Serializable {

    private UUID layoutId;
    private String name;
    private String group;
    private String screenshot;
    private String user;
    private Date date;

    public static MetadataResponseDTO fromEntity(Metadata metadata) {
        return MetadataResponseDTO.builder()
                .layoutId(metadata.getLayout().getId())
                .name(metadata.getName())
                .group(metadata.getGroup())
                .screenshot(metadata.getScreenshot())
                .user(metadata.getUser())
                .date(metadata.getCreated())
                .build();
    }
}
