package org.finos.vuu.layoutserver.controller;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.finos.vuu.layoutserver.dto.response.ApplicationLayoutDto;
import org.finos.vuu.layoutserver.service.ApplicationLayoutService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class ApplicationLayoutControllerTest {
    private static ApplicationLayoutService mockService;
    private static ApplicationLayoutController controller;
    private static final ObjectMapper objectMapper = new ObjectMapper();

    @BeforeEach
    public void setup() {
        mockService = Mockito.mock(ApplicationLayoutService.class);
        controller = new ApplicationLayoutController(mockService);
    }

    @Test
    public void getApplicationLayout_validUser_returnsLayoutFromService() throws JsonProcessingException {
        String user = "user";

        ApplicationLayoutDto expectedDto = ApplicationLayoutDto.builder()
                .user(user)
                .definition(objectMapper.readTree("{\"id\":\"main-tabs\"}"))
                .build();

        when(mockService.getApplicationLayout(user)).thenReturn(expectedDto);

        assertThat(controller.getApplicationLayout(user)).isEqualTo(expectedDto);
        verify(mockService, times(1)).getApplicationLayout(user);
    }

    @Test
    public void createApplicationLayout_validUser_callsService() throws JsonProcessingException {
        String user = "user";
        JsonNode definition = objectMapper.readTree("{\"id\":\"main-tabs\"}");

        controller.createApplicationLayout(user, definition);

        verify(mockService, times(1)).createApplicationLayout(user, definition);
    }

    @Test
    public void updateApplicationLayout_validUser_callsService() throws JsonProcessingException {
        String user = "user";
        JsonNode definition = objectMapper.readTree("{\"id\":\"main-tabs\"}");

        controller.updateApplicationLayout(user, definition);

        verify(mockService, times(1)).updateApplicationLayout(user, definition);
    }

    @Test
    public void deleteApplicationLayout_validUser_callsService() {
        String user = "user";

        controller.deleteApplicationLayout(user);

        verify(mockService, times(1)).deleteApplicationLayout(user);
    }
}
