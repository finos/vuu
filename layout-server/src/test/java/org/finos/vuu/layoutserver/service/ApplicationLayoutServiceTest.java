package org.finos.vuu.layoutserver.service;

import com.fasterxml.jackson.databind.node.ObjectNode;
import org.finos.vuu.layoutserver.model.ApplicationLayout;
import org.finos.vuu.layoutserver.repository.ApplicationLayoutRepository;
import org.finos.vuu.layoutserver.utils.DefaultApplicationLayoutLoader;
import org.finos.vuu.layoutserver.utils.ObjectNodeConverter;
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
    private static final DefaultApplicationLayoutLoader defaultLoader = new DefaultApplicationLayoutLoader();
    private static final ObjectNodeConverter objectNodeConverter = new ObjectNodeConverter();

    @BeforeEach
    public void setup() {
        mockRepo = Mockito.mock(ApplicationLayoutRepository.class);
        service = new ApplicationLayoutService(mockRepo, defaultLoader);
    }

    @Test
    public void getApplicationLayout_noLayout_returnsDefault() {
        when(mockRepo.findById(anyString())).thenReturn(Optional.empty());

        ApplicationLayout actualLayout = service.getApplicationLayout("new user");

        // Expecting application layout as defined in /test/resources/defaultApplicationLayout.json
        ObjectNode expectedDefinition =
                objectNodeConverter.convertToEntityAttribute("{\"defaultLayoutKey\":\"default-layout-value\"}");

        assertThat(actualLayout.getUsername()).isNull();
        assertThat(actualLayout.getApplicationLayout()).isEqualTo(expectedDefinition);
    }

    @Test
    public void getApplicationLayout_layoutExists_returnsLayout() {
        String user = "user";

        ObjectNode expectedDefinition = objectNodeConverter.convertToEntityAttribute("{\"id\":\"main-tabs\"}");
        ApplicationLayout expectedLayout = new ApplicationLayout(user, expectedDefinition);

        when(mockRepo.findById(user)).thenReturn(Optional.of(expectedLayout));

        ApplicationLayout actualLayout = service.getApplicationLayout(user);

        assertThat(actualLayout).isEqualTo(expectedLayout);
    }

    @Test
    public void createApplicationLayout_validDefinition_callsRepoSave() {
        String user = "user";
        ObjectNode definition = objectNodeConverter.convertToEntityAttribute("{\"id\":\"main-tabs\"}");

        service.persistApplicationLayout(user, definition);

        verify(mockRepo, times(1))
                .save(new ApplicationLayout(user, definition));
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
