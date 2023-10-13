package org.finos.vuu.layoutserver.model;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.RequiredArgsConstructor;

import javax.persistence.Column;
import javax.persistence.Entity;
import javax.persistence.Id;

@Data
@Entity
@RequiredArgsConstructor
@AllArgsConstructor
public class ApplicationLayout {
    @Id
    private String username;

    @Column(columnDefinition = "JSON")
    private String definition;

    public String extractDefinition() {
        String extractedDefinition = definition;

        if (extractedDefinition.startsWith("\"") && extractedDefinition.endsWith("\"")) {
            extractedDefinition = extractedDefinition.substring(1, extractedDefinition.length() - 1);
        }

        return extractedDefinition.replaceAll("\\\\", "");
    }
}
