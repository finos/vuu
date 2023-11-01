package org.finos.vuu.layoutserver.service;

import static org.assertj.core.api.AssertionsForClassTypes.assertThat;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.List;
import java.util.NoSuchElementException;
import java.util.Optional;
import java.util.UUID;
import org.finos.vuu.layoutserver.model.BaseMetadata;
import org.finos.vuu.layoutserver.model.Layout;
import org.finos.vuu.layoutserver.model.Metadata;
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
        UUID metadataId = UUID.randomUUID();
        BaseMetadata baseMetadata = new BaseMetadata();
        metadata = new Metadata();
        layout = new Layout();

        baseMetadata.setName("Test Name");
        baseMetadata.setGroup("Test Group");
        baseMetadata.setScreenshot("Test Screenshot");
        baseMetadata.setUser("Test User");

        metadata.setId(metadataId);
        metadata.setBaseMetadata(baseMetadata);

        layout.setDefinition("");
        layout.setMetadata(metadata);
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
    void createLayout_returnsLayout() {
        when(layoutRepository.save(layout)).thenReturn(layout);

        assertThat(layoutService.createLayout(layout)).isEqualTo(layout);
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

        assertThrows(NoSuchElementException.class,
            () -> layoutService.updateLayout(layoutId, layout));
    }

    @Test
    void deleteLayout_callsRepository() {
        layoutService.deleteLayout(layoutId);

        verify(layoutRepository, times(1)).deleteById(layoutId);
    }
}