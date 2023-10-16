package org.finos.vuu.layoutserver.model;

import javax.persistence.Column;
import javax.persistence.Entity;
import javax.persistence.GeneratedValue;
import javax.persistence.GenerationType;
import javax.persistence.Id;

import java.util.Date;
import java.util.UUID;
import lombok.Data;

@Data
@Entity
public class Metadata {

    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    @Column(columnDefinition = "BINARY(16)")
    private UUID id;

    private String name;

    private String group;

    @Column(length = 16384)
    private String screenshot;

    private String user;

    private Date created = new Date();

    private Date updated;
}
