package org.finos.vuu.layoutserver.model;

import java.util.UUID;
import javax.persistence.CascadeType;
import javax.persistence.Column;
import javax.persistence.Entity;
import javax.persistence.Id;
import javax.persistence.JoinColumn;
import javax.persistence.OneToOne;
import lombok.Data;

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

    public void setId(UUID id){
        this.id=id;
        this.metadata.setId(id);
    }
}
