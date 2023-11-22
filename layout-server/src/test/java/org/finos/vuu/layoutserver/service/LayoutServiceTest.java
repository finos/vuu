package org.finos.vuu.layoutserver.service;

import org.finos.vuu.layoutserver.model.BaseMetadata;
import org.finos.vuu.layoutserver.model.Layout;
import org.finos.vuu.layoutserver.model.Metadata;
import org.finos.vuu.layoutserver.repository.LayoutRepository;
import org.finos.vuu.layoutserver.utils.ObjectNodeConverter;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.dao.EmptyResultDataAccessException;

import java.util.NoSuchElementException;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.AssertionsForClassTypes.assertThat;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class LayoutServiceTest {

    private static final UUID LAYOUT_ID = UUID.randomUUID();

    @Mock
    private LayoutRepository layoutRepository;

    @InjectMocks
    private LayoutService layoutService;

    private Layout layout;

    private static final ObjectNodeConverter objectNodeConverter = new ObjectNodeConverter();

    @BeforeEach
    public void setup() {
        BaseMetadata baseMetadata = new BaseMetadata();
        baseMetadata.setName("Test Name");
        baseMetadata.setGroup("Test Group");
        baseMetadata.setScreenshot("Test Screenshot");
        baseMetadata.setUser("Test User");

        Metadata metadata = Metadata.builder().id(LAYOUT_ID).baseMetadata(baseMetadata).build();

        layout = new Layout();
        layout.setMetadata(metadata);
        layout.setId(LAYOUT_ID);
        layout.setDefinition(objectNodeConverter.convertToEntityAttribute("{\"id\":\"main-tabs\"}"));
    }

    @Test
    void getLayout_layoutExists_returnsLayout() {
        when(layoutRepository.findById(LAYOUT_ID)).thenReturn(Optional.of(layout));

        assertThat(layoutService.getLayout(LAYOUT_ID)).isEqualTo(layout);
    }

    @Test
    void getLayout_noLayoutsExist_throwsNotFoundException() {
        when(layoutRepository.findById(LAYOUT_ID)).thenReturn(Optional.empty());

        assertThrows(NoSuchElementException.class,
                () -> layoutService.getLayout(LAYOUT_ID));
    }

    @Test
    void createLayout_anyLayout_returnsNewLayout() {
        when(layoutRepository.save(layout)).thenReturn(layout);

        assertThat(layoutService.createLayout(layout)).isEqualTo(layout);
    }

    @Test
    void updateLayout_layoutExists_callsRepositorySave() {
        when(layoutRepository.findById(LAYOUT_ID)).thenReturn(Optional.of(layout));

        layoutService.updateLayout(LAYOUT_ID, layout);

        verify(layoutRepository, times(1)).save(layout);
    }

    @Test
    void updateLayout_layoutDoesNotExist_throwsNoSuchElementException() {
        when(layoutRepository.findById(LAYOUT_ID)).thenReturn(Optional.empty());

        assertThrows(NoSuchElementException.class,
                () -> layoutService.updateLayout(LAYOUT_ID, layout));
    }

    @Test
    void deleteLayout_anyUUID_callsRepositoryDeleteById() {
        layoutService.deleteLayout(LAYOUT_ID);

        verify(layoutRepository, times(1)).deleteById(LAYOUT_ID);
    }

    @Test
    void deleteLayout_noLayoutExists_throwsNoSuchElementException() {
        doThrow(new EmptyResultDataAccessException(1))
                .when(layoutRepository).deleteById(LAYOUT_ID);

        assertThrows(NoSuchElementException.class,
                () -> layoutService.deleteLayout(LAYOUT_ID));

        verify(layoutRepository, times(1)).deleteById(LAYOUT_ID);
    }
}