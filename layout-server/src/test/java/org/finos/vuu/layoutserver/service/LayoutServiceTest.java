package org.finos.vuu.layoutserver.service;

import java.util.Date;
import java.util.List;
import java.util.NoSuchElementException;
import org.finos.vuu.layoutserver.model.Metadata;

import static org.assertj.core.api.AssertionsForClassTypes.assertThat;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.Optional;
import java.util.UUID;
import org.finos.vuu.layoutserver.model.Layout;
import org.finos.vuu.layoutserver.repository.LayoutRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class LayoutServiceTest {

    @Mock
    private LayoutRepository layoutRepository;

    @Mock
    private MetadataService metadataService;

    @InjectMocks
    private LayoutService layoutService;

    private Layout layout;
    private Metadata metadata;
    private UUID layoutId;

    @BeforeEach
    public void setup() {
        layoutId = UUID.randomUUID();
        UUID metadataId = UUID.randomUUID();
        layout = new Layout();
        metadata = new Metadata();
        layout.setId(layoutId);
        layout.setDefinition("");
        layout.setMetadata(metadata);
        metadata.setId(metadataId);
        metadata.setName("");
        metadata.setGroup("");
        metadata.setScreenshot("");
        metadata.setUser("");
        metadata.setCreated(new Date());
        metadata.setUpdated(new Date());
    }

    @Test
    void getLayout_returnsLayout() {
        when(layoutRepository.findById(layoutId)).thenReturn(Optional.of(layout));

        assertThat(layoutService.getLayout(layoutId)).isEqualTo(layout);
    }

    @Test
    void getMetadata_returnsMetadata() {
        when(metadataService.getMetadata()).thenReturn(List.of(metadata));

        assertThat(layoutService.getMetadata()).isEqualTo(List.of(metadata));
    }

    @Test
    void createLayout() {
        when(layoutRepository.save(layout)).thenReturn(layout);

        assertThat(layoutService.createLayout(layout)).isEqualTo(layoutId);
    }

    @Test
    void updateLayout_layoutExists_callsRepository() {
        when(layoutRepository.findById(layoutId)).thenReturn(Optional.of(layout));

        layoutService.updateLayout(layoutId, layout);

        verify(layoutRepository, times(1)).save(layout);
    }

    @Test
    void updateLayout_layoutDoesNotExist_throwsNoSuchElementException() {
        when(layoutRepository.findById(layoutId)).thenReturn(Optional.empty());

        assertThrows(NoSuchElementException.class, () -> layoutService.updateLayout(layoutId, layout));
    }

    @Test
    void deleteLayout_callsRepository() {
        layoutService.deleteLayout(layoutId);

        verify(layoutRepository, times(1)).deleteById(layoutId);
    }
}