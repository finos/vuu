package org.finos.vuu.layoutserver.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import javax.persistence.Column;
import javax.persistence.Embedded;
import javax.persistence.Entity;
import javax.persistence.Id;
import java.time.LocalDate;
import java.util.UUID;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
@Entity
public class Metadata {

    @Id
    @Column(columnDefinition = "BINARY(16)")
    private UUID id;

    @Embedded
    private BaseMetadata baseMetadata;

    private final LocalDate created = LocalDate.now();

    private LocalDate updated;
}
