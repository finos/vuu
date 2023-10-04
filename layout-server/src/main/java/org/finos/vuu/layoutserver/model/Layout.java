package org.finos.vuu.layoutserver.model;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.OneToOne;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Data
@Entity
public class Layout {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    private String definition;

    @OneToOne(cascade = CascadeType.ALL, orphanRemoval = true)
    @JoinColumn(name = "metadata_id", referencedColumnName = "id")
    private Metadata metadata;
}
