package org.finos.vuu.layoutserver.model;

import org.junit.jupiter.api.Test;

import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;

class LayoutTest {

        @Test
        void setId_anyId_setsIdForBothLayoutAndMetadata() {
            UUID id = UUID.fromString("00000000-0000-0000-0000-000000000000");
            Layout layout = new Layout();
            Metadata metadata = new Metadata();
            layout.setMetadata(metadata);

            layout.setId(id);

            assertThat(layout.getId()).isEqualTo(id);
            assertThat(layout.getMetadata().getId()).isEqualTo(id);
        }
    }
