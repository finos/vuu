package org.finos.vuu.layoutserver.model;

import lombok.Data;

import javax.persistence.*;
import java.util.UUID;

@Data
@Entity
public class Layout {

    @Id
    @Column(columnDefinition = "BINARY(16)")
    private UUID id;

    private String definition;

    @OneToOne(cascade = CascadeType.ALL, orphanRemoval = true)
    @JoinColumn(name = "metadata_id", referencedColumnName = "id")
    private Metadata metadata;

    public void setId(UUID id) {
        this.id=id;
        this.metadata.setId(id);
    }
}
