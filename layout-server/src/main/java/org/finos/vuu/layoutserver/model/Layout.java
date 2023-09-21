package org.finos.vuu.layoutserver.model;

import jakarta.persistence.*;
import lombok.Builder;
import lombok.Data;

@Entity
@Data
@Builder
public class Layout {
    @Id
    @GeneratedValue(strategy= GenerationType.AUTO)
    private String id;

    private String definition;

    @OneToOne(cascade = CascadeType.ALL)
    private Metadata metadata;

    protected Layout() {}
}
