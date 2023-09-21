package org.finos.vuu.layoutserver.controller;

import org.springframework.web.bind.annotation.*;

@RestController("/layout")
public class LayoutController {

    /**
     * Gets all layouts if no IDs are specified, otherwise gets the specified layouts
     *
     * @param ids IDs of the layouts to get
     * @return the layouts
     */
    @GetMapping
    public String getLayouts(@RequestBody(required = false) String[] ids) {
        return "Hello World";
    }

    /**
     * Gets the specified layout
     *
     * @param id ID of the layout to get
     * @return the layout
     */
    @GetMapping("/{id}")
    public String getLayout(@PathVariable String id) {
        return "Hello World";
    }

    /**
     * Gets metadata for all layouts if no IDs are specified, otherwise gets the metadata for specified layouts
     *
     * @param ids IDs of the layouts to get metadata for
     * @return the metadata
     */
    @GetMapping("/metadata")
    public String getMetadata(@RequestBody(required = false) String[] ids) {
        return "Hello World";
    }

    /**
     * Creates a new layout
     *
     * @return the ID of the new layout
     */
    @PostMapping
    public String createLayout() {
        return "Hello World";
    }

    /**
     * Updates the specified layout
     *
     * @param id ID of the layout to update
     * @return the ID of the updated layout
     */
    @PutMapping("/{id}")
    public String updateLayout(@PathVariable String id) {
        return "Hello World";
    }

    /**
     * Deletes the specified layout
     *
     * @param id ID of the layout to delete
     * @return the ID of the deleted layout
     */
    @DeleteMapping("/{id}")
    public String deleteLayout(@PathVariable String id) {
        return "Hello World";
    }
}
