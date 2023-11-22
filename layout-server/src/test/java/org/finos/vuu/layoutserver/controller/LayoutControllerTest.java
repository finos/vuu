package org.finos.vuu.layoutserver.controller;

import com.fasterxml.jackson.core.JsonProcessingException;
import org.finos.vuu.layoutserver.dto.request.LayoutRequestDto;
import org.finos.vuu.layoutserver.dto.request.MetadataRequestDto;
import org.finos.vuu.layoutserver.dto.response.LayoutResponseDto;
import org.finos.vuu.layoutserver.dto.response.MetadataResponseDto;
import org.finos.vuu.layoutserver.model.BaseMetadata;
import org.finos.vuu.layoutserver.model.Layout;
import org.finos.vuu.layoutserver.model.Metadata;
import org.finos.vuu.layoutserver.service.LayoutService;
import org.finos.vuu.layoutserver.service.MetadataService;
import org.finos.vuu.layoutserver.utils.ObjectNodeConverter;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.modelmapper.ModelMapper;

import java.util.List;
import java.util.NoSuchElementException;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class LayoutControllerTest {

    private static final String LAYOUT_DEFINITION_STRING = "{\"id\":\"main-tabs\"}";
    private static final String LAYOUT_GROUP = "Test Group";
    private static final String LAYOUT_NAME = "Test Layout";
    private static final String LAYOUT_SCREENSHOT = "Test Screenshot";
    private static final String LAYOUT_USER = "Test User";
    private static final UUID VALID_ID = UUID.randomUUID();
    private static final UUID DOES_NOT_EXIST_ID = UUID.randomUUID();
    private static final ObjectNodeConverter objectNodeConverter = new ObjectNodeConverter();

    @Mock
    private LayoutService layoutService;

    @Mock
    private MetadataService metadataService;

    @Mock
    private ModelMapper modelMapper;

    @InjectMocks
    private LayoutController layoutController;

    private Layout layout;
    private Metadata metadata;
    private BaseMetadata baseMetadata;
    private LayoutRequestDto layoutRequest;
    private LayoutResponseDto expectedLayoutResponse;
    private MetadataResponseDto metadataResponse;

    @BeforeEach
    public void setup() throws JsonProcessingException {
        baseMetadata = new BaseMetadata();
        baseMetadata.setName(LAYOUT_NAME);
        baseMetadata.setUser(LAYOUT_USER);
        baseMetadata.setGroup(LAYOUT_GROUP);
        baseMetadata.setScreenshot(LAYOUT_SCREENSHOT);

        metadata = Metadata.builder().id(VALID_ID).baseMetadata(baseMetadata).build();

        layout = new Layout();
        layout.setMetadata(metadata);
        layout.setId(VALID_ID);
        layout.setDefinition(objectNodeConverter.convertToEntityAttribute(LAYOUT_DEFINITION_STRING));

        layoutRequest = new LayoutRequestDto();
        MetadataRequestDto metadataRequestDto = new MetadataRequestDto();
        metadataRequestDto.setBaseMetadata(baseMetadata);
        layoutRequest.setDefinition(layout.getDefinition());
        layoutRequest.setMetadata(metadataRequestDto);

        metadataResponse = getMetadataResponseDto();

        expectedLayoutResponse = new LayoutResponseDto();
        expectedLayoutResponse.setId(layout.getId());
        expectedLayoutResponse.setDefinition(layout.getDefinition());
        expectedLayoutResponse.setMetadata(metadataResponse);

    }


    @Test
    void getLayout_layoutExists_returnsLayout() {
        when(layoutService.getLayout(VALID_ID)).thenReturn(layout);
        when(modelMapper.map(layout, LayoutResponseDto.class)).thenReturn(expectedLayoutResponse);
        assertThat(layoutController.getLayout(VALID_ID)).isEqualTo(expectedLayoutResponse);
    }

    @Test
    void getLayout_layoutDoesNotExist_throwsNoSuchElementException() {
        when(layoutService.getLayout(DOES_NOT_EXIST_ID))
                .thenThrow(NoSuchElementException.class);

        assertThrows(NoSuchElementException.class,
                () -> layoutController.getLayout(DOES_NOT_EXIST_ID));
    }

    @Test
    void getMetadata_metadataExists_returnsMetadata() {
        List<Metadata> metadataList = List.of(metadata);

        when(metadataService.getMetadata()).thenReturn(metadataList);
        when(modelMapper.map(metadata, MetadataResponseDto.class))
                .thenReturn(metadataResponse);

        assertThat(layoutController.getMetadata()).isEqualTo(List.of(metadataResponse));
    }

    @Test
    void getMetadata_noMetadataExists_returnsEmptyArray() {
        when(metadataService.getMetadata()).thenReturn(List.of());
        assertThat(layoutController.getMetadata()).isEmpty();
    }

    @Test
    void createLayout_validLayout_returnsCreatedLayout() {
        Layout layoutWithoutIds = layout;
        layoutWithoutIds.setId(null);

        when(modelMapper.map(layoutRequest, Layout.class)).thenReturn(layoutWithoutIds);
        when(layoutService.createLayout(layoutWithoutIds)).thenReturn(layout);
        when(modelMapper.map(layout, LayoutResponseDto.class)).thenReturn(expectedLayoutResponse);

        assertThat(layoutController.createLayout(layoutRequest)).isEqualTo(expectedLayoutResponse);
    }

    @Test
    void updateLayout_validLayout_callsLayoutService() {
        layout.setId(null);

        when(modelMapper.map(layoutRequest, Layout.class)).thenReturn(layout);

        layoutController.updateLayout(VALID_ID, layoutRequest);

        verify(layoutService).updateLayout(VALID_ID, layout);
    }

    @Test
    void deleteLayout__validId_callsLayoutService() {
        layoutController.deleteLayout(VALID_ID);

        verify(layoutService).deleteLayout(VALID_ID);
    }

    private MetadataResponseDto getMetadataResponseDto() {
        MetadataResponseDto metadataResponse = new MetadataResponseDto();
        metadataResponse.setId(layout.getId());
        metadataResponse.setBaseMetadata(baseMetadata);
        metadataResponse.setCreated(layout.getMetadata().getCreated());
        metadataResponse.setUpdated(layout.getMetadata().getUpdated());
        return metadataResponse;
    }
}
