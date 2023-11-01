package org.finos.vuu.layoutserver.controller;

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.ArrayList;
import java.util.List;
import java.util.NoSuchElementException;
import java.util.UUID;
import org.finos.vuu.layoutserver.dto.request.LayoutRequestDTO;
import org.finos.vuu.layoutserver.dto.request.MetadataRequestDTO;
import org.finos.vuu.layoutserver.dto.response.LayoutResponseDTO;
import org.finos.vuu.layoutserver.dto.response.MetadataResponseDTO;
import org.finos.vuu.layoutserver.model.BaseMetadata;
import org.finos.vuu.layoutserver.model.Layout;
import org.finos.vuu.layoutserver.model.Metadata;
import org.finos.vuu.layoutserver.service.LayoutService;
import org.finos.vuu.layoutserver.service.MetadataService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.modelmapper.ModelMapper;

@ExtendWith(MockitoExtension.class)
class LayoutControllerTest {

    @Mock
    private LayoutService layoutService;

    @Mock
    private MetadataService metadataService;

    @Mock
    private ModelMapper modelMapper;

    @InjectMocks
    private LayoutController layoutController;

    private UUID validLayoutId;
    private UUID doesNotExistLayoutId;
    private Layout layout;
    private Metadata metadata;
    private BaseMetadata baseMetadata;
    private LayoutRequestDTO layoutRequest;
    private LayoutResponseDTO expectedLayoutResponse;
    private List<MetadataResponseDTO> expectedMetadataResponse;

    @BeforeEach
    public void setup() {
        validLayoutId = UUID.randomUUID();
        doesNotExistLayoutId = UUID.randomUUID();
        String layoutDefinition = "Test Definition";

        baseMetadata = new BaseMetadata();
        baseMetadata.setName("Test Layout");
        baseMetadata.setUser("Test User");
        baseMetadata.setGroup("Test Group");
        baseMetadata.setScreenshot("Test Screenshot");

        metadata = new Metadata();
        metadata.setBaseMetadata(baseMetadata);

        layout = new Layout();
        layout.setMetadata(metadata);
        layout.setId(validLayoutId);
        layout.setDefinition(layoutDefinition);

        layoutRequest = new LayoutRequestDTO();
        MetadataRequestDTO metadataRequestDTO = new MetadataRequestDTO();
        metadataRequestDTO.setBaseMetadata(baseMetadata);
        layoutRequest.setDefinition(layout.getDefinition());
        layoutRequest.setMetadata(metadataRequestDTO);

        expectedLayoutResponse = new LayoutResponseDTO();
        expectedLayoutResponse.setDefinition(layout.getDefinition());

        MetadataResponseDTO metadataResponse = getMetadataResponseDTO();
        expectedLayoutResponse.setMetadata(metadataResponse);

        expectedMetadataResponse = new ArrayList<>();
        expectedMetadataResponse.add(metadataResponse);
    }


    @Test
    void getLayout_layoutExists_returnsLayout() {
        when(layoutService.getLayout(validLayoutId)).thenReturn(layout);
        when(modelMapper.map(layout, LayoutResponseDTO.class)).thenReturn(
            expectedLayoutResponse);
        assertThat(layoutController.getLayout(validLayoutId)).isEqualTo(expectedLayoutResponse);
    }

    @Test
    void getLayout_layoutDoesNotExist_throwsNotFoundAndReturns404() {
        when(layoutService.getLayout(doesNotExistLayoutId)).thenThrow(NoSuchElementException.class);
        assertThrows(NoSuchElementException.class,
            () -> layoutController.getLayout(doesNotExistLayoutId));
    }

    @Test
    void getMetadata_metadataExists_returnsMetadata() {
        when(metadataService.getMetadata()).thenReturn(List.of(metadata));
        when(modelMapper.map(metadata, MetadataResponseDTO.class)).thenReturn(
            getMetadataResponseDTO());

        assertThat(layoutController.getMetadata()).isEqualTo(expectedMetadataResponse);
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
        layoutWithoutIds.getMetadata().setId(null);

        when(modelMapper.map(layoutRequest, Layout.class)).thenReturn(layoutWithoutIds);
        when(layoutService.createLayout(layoutWithoutIds)).thenReturn(layout);
        when(modelMapper.map(layout, LayoutResponseDTO.class)).thenReturn(expectedLayoutResponse);

        assertThat(layoutController.createLayout(layoutRequest))
            .isEqualTo(expectedLayoutResponse);
    }

    @Test
    void updateLayout_callsLayoutService() {

        when(modelMapper.map(layoutRequest, Layout.class)).thenReturn(layout);

        layoutController.updateLayout(validLayoutId, layoutRequest);

        verify(layoutService).updateLayout(validLayoutId, layout);
    }

    @Test
    void deleteLayout_callsLayoutService() {
        layoutController.deleteLayout(validLayoutId);

        verify(layoutService).deleteLayout(validLayoutId);
    }

    private MetadataResponseDTO getMetadataResponseDTO() {
        MetadataResponseDTO metadataResponse = new MetadataResponseDTO();
        metadataResponse.setBaseMetadata(baseMetadata);
        metadataResponse.setCreated(layout.getMetadata().getCreated());
        metadataResponse.setUpdated(layout.getMetadata().getUpdated());
        metadataResponse.setId(layout.getId());
        return metadataResponse;
    }
}
