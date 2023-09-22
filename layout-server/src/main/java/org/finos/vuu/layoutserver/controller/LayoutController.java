package org.finos.vuu.layoutserver.controller;

import org.finos.vuu.layoutserver.dto.response.LayoutDTO;
import org.finos.vuu.layoutserver.dto.response.MetadataDTO;
import org.finos.vuu.layoutserver.model.Layout;
import org.finos.vuu.layoutserver.model.Metadata;
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

@RestController
@RequestMapping("/layout")
public class LayoutController {

    public static final String LAYOUT_ID = "testLayoutId";

    // TODO: Delete dummy data
    private Layout createDummyLayout(String id) {
        Layout layout = new Layout();
        layout.setId(id);
        layout.setDefinition("testDefinition");
        Metadata metadata = new Metadata();
        metadata.setId("testMetadataId");
        metadata.setLayout(layout);
        metadata.setName("testName");
        metadata.setGroup("testGroup");
        metadata.setScreenshot("testScreenshot");
        metadata.setUser("testUser");
        layout.setMetadata(metadata);
        return layout;
    }

    /**
     * Gets the specified layout
     *
     * @param id ID of the layout to get
     * @return the layout
     */
    @GetMapping("/{id}")
    public LayoutDTO getLayout(@PathVariable String id) {
        Layout layout = createDummyLayout(id);
        return LayoutDTO.fromEntity(layout);
    }

    /**
     * Gets metadata for all layouts
     *
     * @return the metadata
     */
    @GetMapping("/metadata")
    public List<MetadataDTO> getMetadata() {
        Layout layout = createDummyLayout(LAYOUT_ID);
        return List.of(MetadataDTO.fromEntity(layout.getMetadata()));
    }

    /**
     * Creates a new layout
     *
     * @return the ID of the new layout
     */
    @ResponseStatus(HttpStatus.CREATED)
    @PostMapping
    public String createLayout(@RequestBody LayoutDTO layoutDTO) {
        return createDummyLayout(LAYOUT_ID).getId();
    }

    /**
     * Updates the specified layout
     *
     * @param id        ID of the layout to update
     * @param layoutDTO the new data to overwrite the layout with
     */
    @ResponseStatus(HttpStatus.ACCEPTED)
    @PutMapping("/{id}")
    public void updateLayout(@PathVariable String id, @RequestBody LayoutDTO layoutDTO) {
        createDummyLayout(LAYOUT_ID);
    }

    /**
     * Deletes the specified layout
     *
     * @param id ID of the layout to delete
     */
    @ResponseStatus(HttpStatus.ACCEPTED)
    @DeleteMapping("/{id}")
    public void deleteLayout(@PathVariable String id) {}
}
