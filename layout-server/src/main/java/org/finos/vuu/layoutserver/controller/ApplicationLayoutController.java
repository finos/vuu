package org.finos.vuu.layoutserver.controller;

import lombok.RequiredArgsConstructor;
import org.finos.vuu.layoutserver.dto.response.ApplicationLayoutDto;
import org.finos.vuu.layoutserver.service.ApplicationLayoutService;
import org.modelmapper.ModelMapper;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RequiredArgsConstructor
@RestController
@RequestMapping("/application-layouts")
public class ApplicationLayoutController {

    private final ApplicationLayoutService service;
    private final ModelMapper mapper;

    /**
     * Gets the persisted application layout for the requesting user. If the requesting user does not have an
     * application layout persisted, a default layout with a null username is returned instead. No more than one
     * application layout can be persisted for a given user.
     *
     * @return the application layout
     */
    @ResponseStatus(HttpStatus.OK)
    @GetMapping
    public ApplicationLayoutDto getApplicationLayout(@RequestHeader("username") String username) {
        return mapper.map(service.getApplicationLayout(username), ApplicationLayoutDto.class);
    }

    /**
     * Creates or updates the unique application layout for the requesting user.
     *
     * @param applicationLayoutDto JSON representation of all relevant data about the application
     *                          layout to be created
     * @param username         the user making the request
     */
    @ResponseStatus(HttpStatus.CREATED)
    @PutMapping
    public void persistApplicationLayout(@RequestHeader("username") String username,
        @RequestBody ApplicationLayoutDto applicationLayoutDto) {
        service.persistApplicationLayout(username,
                applicationLayoutDto.getApplicationLayout(),
                applicationLayoutDto.getSettings());
    }

    /**
     * Deletes the application layout for the requesting user. A 404 will be returned if there is no existing
     * application layout.
     *
     * @param username         the user making the request
     */
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @DeleteMapping
    public void deleteApplicationLayout(@RequestHeader("username") String username) {
        service.deleteApplicationLayout(username);
    }
}
