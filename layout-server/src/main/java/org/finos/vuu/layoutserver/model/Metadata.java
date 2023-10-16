package org.finos.vuu.layoutserver.model;

import java.util.Date;
import java.util.UUID;
import javax.persistence.Column;
import javax.persistence.Entity;
import javax.persistence.GeneratedValue;
import javax.persistence.GenerationType;
import javax.persistence.Id;
import javax.persistence.OneToOne;
import lombok.Data;

@Data
@Entity
public class Metadata {

    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private UUID id;

    @OneToOne(mappedBy = "metadata")
    private Layout layout;

    private String name;

    private String group;

    @Column(length = 16384)
    private String screenshot;

    private String user;

    private Date created = new Date();

    private Date updated;
}
