package org.finos.vuu.layoutserver.dto.response;

import lombok.Data;

import java.util.Date;
import java.util.UUID;

@Data
public class CreateLayoutResponseDTO {

    private UUID id;

    /**
     * The generated creation date of the created layout
     */
    private Date created;
}
