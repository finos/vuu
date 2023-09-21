package org.finos.vuu.layoutserver.model;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.Id;
import lombok.Builder;
import lombok.Data;

import java.util.Date;

@Entity
@Data
@Builder
public class Metadata {

    @Id
    @GeneratedValue
    private Long id;

    private String name;
    private String group;
    private String screenshot;
    private String user;
    private Date date;

    protected Metadata() {
    }
}
