package org.finos.vuu.layoutserver.dto.response;

import lombok.Builder;
import lombok.Data;
import org.finos.vuu.layoutserver.model.Metadata;

import java.io.Serializable;
import java.util.Date;

@Data
@Builder
public class MetadataDTO implements Serializable {

    private String layoutId;
    private String name;
    private String group;
    private String screenshot;
    private String user;
    private Date date;

    public static MetadataDTO fromEntity(Metadata metadata) {
        return MetadataDTO.builder()
                .layoutId(metadata.getLayout().getId())
                .name(metadata.getName())
                .group(metadata.getGroup())
                .screenshot(metadata.getScreenshot())
                .user(metadata.getUser())
                .date(metadata.getDate())
                .build();
    }
}
