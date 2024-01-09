package org.finos.vuu.layoutserver.controller;

import com.fasterxml.jackson.databind.node.ObjectNode;
import org.finos.vuu.layoutserver.model.ApplicationLayout;
import org.finos.vuu.layoutserver.service.ApplicationLayoutService;
import org.finos.vuu.layoutserver.utils.ObjectNodeConverter;
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
    private static final ObjectNodeConverter objectNodeConverter = new ObjectNodeConverter();

    @BeforeEach
    public void setup() {
        mockService = Mockito.mock(ApplicationLayoutService.class);
        controller = new ApplicationLayoutController(mockService);
    }

    @Test
    public void getApplicationLayout_anyUsername_returnsLayoutFromService() {
        String user = "user";
        ObjectNode definition = objectNodeConverter.convertToEntityAttribute("{\"id\":\"main-tabs\"}");

        when(mockService.getApplicationLayout(user))
                .thenReturn(new ApplicationLayout(user, definition));

        ObjectNode response = controller.getApplicationLayout(user);

        assertThat(response).isEqualTo(definition);

        verify(mockService, times(1)).getApplicationLayout(user);
    }

    @Test
    public void persistApplicationLayout_anyInput_callsService() {
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
