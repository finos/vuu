package org.finos.vuu.layoutserver.dto.request;

import lombok.Data;
import org.finos.vuu.layoutserver.model.Metadata;

import java.io.Serializable;
import java.util.Date;

@Data
public class MetadataRequestDTO implements Serializable {

    private String name;
    private String group;
    private String screenshot;
    private String user;

    public Metadata toEntity() {
        Metadata metadata = new Metadata();
        metadata.setName(name);
        metadata.setGroup(group);
        metadata.setScreenshot(screenshot);
        metadata.setUser(user);
        metadata.setUpdated(new Date());
        return metadata;
    }
}
