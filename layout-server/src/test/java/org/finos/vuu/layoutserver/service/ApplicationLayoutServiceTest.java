package org.finos.vuu.layoutserver.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.finos.vuu.layoutserver.dto.response.ApplicationLayoutDto;
import org.finos.vuu.layoutserver.model.ApplicationLayout;
import org.finos.vuu.layoutserver.repository.ApplicationLayoutRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;
import org.springframework.dao.EmptyResultDataAccessException;

import java.util.NoSuchElementException;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class ApplicationLayoutServiceTest {

    private static ApplicationLayoutRepository mockRepo;
    private static ApplicationLayoutService service;
    private static final ObjectMapper objectMapper = new ObjectMapper();

    @BeforeEach
    public void setup() {
        mockRepo = Mockito.mock(ApplicationLayoutRepository.class);
        service = new ApplicationLayoutService(mockRepo);
    }

    @Test
    public void getApplicationLayout_noLayout_returnsDefault() throws JsonProcessingException {
        when(mockRepo.findById(anyString())).thenReturn(Optional.empty());

        ApplicationLayoutDto actualLayout = service.getApplicationLayout("new user");
        // Expecting application layout as defined in /test/resources/defaultLayout.json
        JsonNode expectedDefinition = objectMapper.readTree("{\"defaultLayoutKey\":\"default-layout-value\"}");

        assertThat(actualLayout.getUser()).isNull();
        assertThat(actualLayout.getDefinition()).isEqualTo(expectedDefinition);
    }

    @Test
    public void getApplicationLayout_layoutExists_returnsLayout() {
        String expectedDefinition = "{\"id\":\"main-tabs\"}";
        String user = "user";
        ApplicationLayout expectedLayout = new ApplicationLayout(user, expectedDefinition);

        when(mockRepo.findById(user)).thenReturn(Optional.of(expectedLayout));

        ApplicationLayoutDto actualLayout = service.getApplicationLayout(user);

        assertThat(actualLayout.getUser()).isEqualTo(user);
        assertThat(actualLayout.getDefinition().toString()).isEqualToIgnoringWhitespace(expectedDefinition);
    }

    @Test
    public void createApplicationLayout_validDefinition_callsRepoSave() throws JsonProcessingException {
        String definition = "{\"id\":\"main-tabs\"}";
        String user = "user";

        service.createApplicationLayout(user, objectMapper.readTree(definition));

        ApplicationLayout expectedLayout = new ApplicationLayout(user, definition);
        verify(mockRepo, times(1)).save(expectedLayout);
    }

    @Test
    public void createApplicationLayout_invalidDefinition_throwsJsonException() {
        String definition = "invalid JSON";

        assertThrows(JsonProcessingException.class, () ->
            service.createApplicationLayout("user", objectMapper.readTree(definition))
        );
    }

    @Test
    public void updateApplicationLayout_validDefinition_callsRepoSave() throws JsonProcessingException {
        String definition = "{\"id\":\"main-tabs\"}";
        String user = "user";

        service.updateApplicationLayout(user, objectMapper.readTree(definition));

        ApplicationLayout expectedLayout = new ApplicationLayout(user, definition);
        verify(mockRepo, times(1)).save(expectedLayout);
    }

    @Test
    public void updateApplicationLayout_invalidDefinition_throwsJsonException() {
        String definition = "invalid JSON";

        assertThrows(JsonProcessingException.class, () ->
            service.updateApplicationLayout("user", objectMapper.readTree(definition))
        );
    }

    @Test
    public void deleteApplicationLayout_entryExists_callsRepoDelete() {
        String user = "user";

        service.deleteApplicationLayout(user);

        verify(mockRepo, times(1)).deleteById(user);
    }

    @Test
    public void deleteApplicationLayout_deleteFails_throwsException() {
        String user = "user";

        doThrow(EmptyResultDataAccessException.class).when(mockRepo).deleteById(user);

        NoSuchElementException exception = assertThrows(NoSuchElementException.class, () ->
                service.deleteApplicationLayout(user)
        );

        assertThat(exception.getMessage()).isEqualTo("No layout found for user: " + user);
    }
}
