package org.finos.vuu.layoutserver.model;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.OneToOne;
import java.util.Date;
import java.util.UUID;
import lombok.Data;
import lombok.ToString;

@Data
@Entity
public class Metadata {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @OneToOne(mappedBy = "metadata")
    @ToString.Exclude
    private Layout layout;

    private String name;
    private String group;
    private String screenshot;
    private String user;
    private Date created = new Date();
    private Date updated;
}
