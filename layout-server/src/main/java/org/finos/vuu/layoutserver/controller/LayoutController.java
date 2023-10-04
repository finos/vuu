package org.finos.vuu.layoutserver.controller;

import lombok.RequiredArgsConstructor;
import org.finos.vuu.layoutserver.dto.request.LayoutRequestDTO;
import org.finos.vuu.layoutserver.dto.response.LayoutResponseDTO;
import org.finos.vuu.layoutserver.dto.response.MetadataResponseDTO;
import org.finos.vuu.layoutserver.model.Layout;
import org.finos.vuu.layoutserver.service.LayoutService;
import org.modelmapper.ModelMapper;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

@RequiredArgsConstructor
@RestController
@RequestMapping("/layouts")
public class LayoutController {

    private final LayoutService layoutService;
    private final ModelMapper mapper;

    /**
     * Gets the specified layout
     *
     * @param id ID of the layout to get
     * @return the layout
     */
    @GetMapping("/{id}")
    public LayoutResponseDTO getLayout(@PathVariable UUID id) {
        return mapper.map(layoutService.getLayout(id), LayoutResponseDTO.class);
    }

    /**
     * Gets metadata for all layouts
     *
     * @return the metadata
     */
    @GetMapping("/metadata")
    public List<MetadataResponseDTO> getMetadata() {

        return layoutService.getMetadata()
                .stream()
                .map(metadata -> mapper.map(metadata, MetadataResponseDTO.class))
                .toList();
    }

    /**
     * Creates a new layout
     *
     * @param layoutToCreate the layout to be created
     * @return the generated ID of the new layout
     */
    @ResponseStatus(HttpStatus.CREATED)
    @PostMapping
    public UUID createLayout(@RequestBody LayoutRequestDTO layoutToCreate) {
        Layout layout = mapper.map(layoutToCreate, Layout.class);

        return layoutService.createLayout(layout);
    }

    /**
     * Updates the specified layout
     *
     * @param id        ID of the layout to update
     * @param newLayout the new layout
     */
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @PutMapping("/{id}")
    public void updateLayout(@PathVariable UUID id, @RequestBody LayoutRequestDTO newLayout) {
        Layout layout = layoutService.getLayout(id);
        mapper.map(newLayout, layout);

        layoutService.updateLayout(layout);
    }

    /**
     * Deletes the specified layout
     *
     * @param id ID of the layout to delete
     */
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @DeleteMapping("/{id}")
    public void deleteLayout(@PathVariable UUID id) {
        layoutService.deleteLayout(id);
    }
}
