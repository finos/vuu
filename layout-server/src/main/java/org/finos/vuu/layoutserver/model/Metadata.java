package org.finos.vuu.layoutserver.model;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.NonNull;

import java.util.Date;

@Data
@NoArgsConstructor
@Entity
public class Metadata {

    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private String id;

    @OneToOne(mappedBy = "metadata")
    @NonNull
    private Layout layout;

    private String name;
    private String group;
    private String screenshot;
    private String user;
    private Date date = new Date();
}
