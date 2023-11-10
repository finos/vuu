package org.finos.vuu.layoutserver.controller;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.node.ObjectNode;
import org.finos.vuu.layoutserver.dto.response.ApplicationLayoutDto;
import org.finos.vuu.layoutserver.model.ApplicationLayout;
import org.finos.vuu.layoutserver.service.ApplicationLayoutService;
import org.finos.vuu.layoutserver.utils.ObjectNodeConverter;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;
import org.modelmapper.ModelMapper;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.*;

class ApplicationLayoutControllerTest {
    private static ApplicationLayoutService mockService;
    private static ApplicationLayoutController controller;
    private static final ModelMapper modelMapper = new ModelMapper();
    private static final ObjectNodeConverter objectNodeConverter = new ObjectNodeConverter();

    @BeforeEach
    public void setup() {
        mockService = Mockito.mock(ApplicationLayoutService.class);
        controller = new ApplicationLayoutController(mockService, modelMapper);
    }

    @Test
    public void getApplicationLayout_anyUsername_returnsLayoutFromService() throws JsonProcessingException {
        String user = "user";
        ObjectNode definition = objectNodeConverter.convertToEntityAttribute("{\"id\":\"main-tabs\"}");

        when(mockService.getApplicationLayout(user))
                .thenReturn(new ApplicationLayout(user, definition));

        ApplicationLayoutDto response = controller.getApplicationLayout(user);

        assertThat(response.getUsername()).isEqualTo(user);
        assertThat(response.getDefinition()).isEqualTo(definition);

        verify(mockService, times(1)).getApplicationLayout(user);
    }

    @Test
    public void persistApplicationLayout_anyInput_callsService() throws JsonProcessingException {
        String user = "user";
        ObjectNode definition = objectNodeConverter.convertToEntityAttribute("{\"id\":\"main-tabs\"}");

        controller.persistApplicationLayout(user, definition);

        verify(mockService, times(1)).persistApplicationLayout(user, definition);
    }

    @Test
    public void deleteApplicationLayout_anyUsername_callsService() {
        String user = "user";

        controller.deleteApplicationLayout(user);

        verify(mockService, times(1)).deleteApplicationLayout(user);
    }
}
