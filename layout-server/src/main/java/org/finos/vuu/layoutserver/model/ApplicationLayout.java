package org.finos.vuu.layoutserver.model;

import com.fasterxml.jackson.databind.node.ObjectNode;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.finos.vuu.layoutserver.utils.ObjectNodeConverter;

import javax.persistence.Column;
import javax.persistence.Convert;
import javax.persistence.Entity;
import javax.persistence.Id;

@Data
@Entity
@RequiredArgsConstructor
@AllArgsConstructor
public class ApplicationLayout {
    @Id
    private String username;

    @Convert(converter = ObjectNodeConverter.class)
    @Column(columnDefinition = "JSON")
    private ObjectNode applicationLayout;
}
