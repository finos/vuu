package org.finos.vuu.layoutserver.model;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.NonNull;

import java.util.Date;
import java.util.UUID;

@Data
@NoArgsConstructor
@Entity
public class Metadata {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @OneToOne(mappedBy = "metadata")
    @NonNull
    private Layout layout;

    private String name;
    private String group;
    private String screenshot;
    private String user;
    private Date created = new Date();
    private Date updated;
}
