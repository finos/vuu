package org.finos.vuu.layoutserver.service;

import static org.assertj.core.api.AssertionsForClassTypes.assertThat;
import static org.mockito.Mockito.when;

import java.util.List;
import org.finos.vuu.layoutserver.model.Metadata;
import org.finos.vuu.layoutserver.repository.MetadataRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class MetadataServiceTest {

    @Mock
    private MetadataRepository metadataRepository;

    @InjectMocks
    private MetadataService metadataService;

    @Test
    void getMetadata_metadataExists_returnsMetadata() {
        Metadata metadata = Metadata.builder().build();

        when(metadataRepository.findAll()).thenReturn(List.of(metadata));
        assertThat(metadataService.getMetadata()).isEqualTo(List.of(metadata));
    }

    @Test
    void getMetadata_noMetadataExists_returnsEmptyList() {
        when(metadataRepository.findAll()).thenReturn(List.of());
        assertThat(metadataService.getMetadata()).isEqualTo(List.of());
    }
}