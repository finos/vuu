package org.finos.vuu.layoutserver.controller;

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

import java.util.ArrayList;
import java.util.List;
import java.util.NoSuchElementException;
import java.util.UUID;
import org.finos.vuu.layoutserver.dto.request.LayoutRequestDTO;
import org.finos.vuu.layoutserver.dto.request.MetadataRequestDTO;
import org.finos.vuu.layoutserver.dto.response.GetLayoutResponseDTO;
import org.finos.vuu.layoutserver.dto.response.MetadataResponseDTO;
import org.finos.vuu.layoutserver.model.Layout;
import org.finos.vuu.layoutserver.model.Metadata;
import org.finos.vuu.layoutserver.service.LayoutService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.Spy;
import org.mockito.junit.jupiter.MockitoExtension;
import org.modelmapper.ModelMapper;

@ExtendWith(MockitoExtension.class)
class LayoutControllerTest {

    @Mock
    private LayoutService layoutService;
    // TODO Should modelmapper be mocked out?
    @Spy
    private ModelMapper modelMapper;
    @InjectMocks
    private LayoutController layoutController;

    private UUID validLayoutId;
    private UUID doesNotExistLayoutId;
    private Layout layout;
    private Metadata metadata;
    private LayoutRequestDTO layoutRequest;
    private GetLayoutResponseDTO expectedLayoutResponse;
    private List<MetadataResponseDTO> expectedMetadataResponse;

    @BeforeEach
    public void setup() {
        validLayoutId = UUID.randomUUID();
        doesNotExistLayoutId = UUID.randomUUID();
        UUID metadataId = UUID.randomUUID();
        String layoutDefinition = "Test Definition";

        metadata = new Metadata();
        metadata.setId(metadataId);
        metadata.setName("Test Layout");
        metadata.setUser("Test User");
        metadata.setGroup("Test Group");
        metadata.setScreenshot("Test Screenshot");

        layout = new Layout();
        layout.setId(validLayoutId);
        layout.setDefinition(layoutDefinition);
        layout.setMetadata(metadata);
        metadata.setLayout(layout);

        layoutRequest = new LayoutRequestDTO();
        MetadataRequestDTO metadataRequestDTO = new MetadataRequestDTO();
        metadataRequestDTO.setName(metadata.getName());
        metadataRequestDTO.setUser(metadata.getUser());
        metadataRequestDTO.setGroup(metadata.getGroup());
        metadataRequestDTO.setScreenshot(metadata.getScreenshot());
        layoutRequest.setDefinition(layout.getDefinition());
        layoutRequest.setMetadata(metadataRequestDTO);

        expectedLayoutResponse = new GetLayoutResponseDTO();
        expectedLayoutResponse.setId(layout.getId());
        expectedLayoutResponse.setDefinition(layout.getDefinition());

        MetadataResponseDTO metadataResponse = getMetadataResponseDTO();
        expectedLayoutResponse.setMetadata(metadataResponse);

        expectedMetadataResponse = new ArrayList<>();
        expectedMetadataResponse.add(metadataResponse);
    }


    @Test
    void getLayout_validIdAndLayoutExists_returnsLayout() {
        when(layoutService.getLayout(validLayoutId)).thenReturn(layout);
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
        when(layoutService.getMetadata()).thenReturn(List.of(metadata));
        assertThat(layoutController.getMetadata()).isEqualTo(expectedMetadataResponse);
    }

    @Test
    void getMetadata_noMetadataExists_returnsEmptyArray() {
        when(layoutService.getMetadata()).thenReturn(List.of());
        assertThat(layoutController.getMetadata()).isEmpty();
    }

    @Test
    void createLayout_validLayout_createsLayout() {
        when(layoutService.createLayout(any(Layout.class))).thenReturn(layout.getId());
        when(layoutService.getLayout(layout.getId())).thenReturn(layout);
        assertThat(layoutController.createLayout(layoutRequest).getId()).isEqualTo(layout.getId());
    }

    @Test
    void updateLayout_layoutDoesNotExist_returnsInvalidRequest() {
        when(layoutService.getLayout(layout.getId())).thenThrow(NoSuchElementException.class);
        assertThrows(NoSuchElementException.class,
            () -> layoutController.updateLayout(layout.getId(), layoutRequest));
    }

    private MetadataResponseDTO getMetadataResponseDTO() {
        MetadataResponseDTO metadataResponse = new MetadataResponseDTO();
        metadataResponse.setLayoutId(layout.getId());
        metadataResponse.setName(layout.getMetadata().getName());
        metadataResponse.setUser(layout.getMetadata().getUser());
        metadataResponse.setGroup(layout.getMetadata().getGroup());
        metadataResponse.setScreenshot(layout.getMetadata().getScreenshot());
        metadataResponse.setCreated(layout.getMetadata().getCreated());
        metadataResponse.setUpdated(layout.getMetadata().getUpdated());
        return metadataResponse;
    }
}
