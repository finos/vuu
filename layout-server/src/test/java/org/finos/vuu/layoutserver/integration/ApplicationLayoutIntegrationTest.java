package org.finos.vuu.layoutserver.integration;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import org.finos.vuu.layoutserver.exceptions.InternalServerErrorException;
import org.finos.vuu.layoutserver.model.ApplicationLayout;
import org.finos.vuu.layoutserver.repository.ApplicationLayoutRepository;
import org.finos.vuu.layoutserver.utils.DefaultApplicationLayoutLoader;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import java.util.HashMap;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.contains;
import static org.hamcrest.Matchers.is;
import static org.hamcrest.Matchers.iterableWithSize;
import static org.hamcrest.Matchers.nullValue;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
public class ApplicationLayoutIntegrationTest {
    private static final ObjectMapper objectMapper = new ObjectMapper();
    private static final String BASE_URL = "/application-layouts";
    private static final String MISSING_USERNAME_ERROR_MESSAGE =
            "Required request header 'username' for method parameter type String is not present";

    @Autowired
    private MockMvc mockMvc;
    @Autowired
    private ApplicationLayoutRepository repository;
    @MockBean
    private DefaultApplicationLayoutLoader mockLoader;
    private final DefaultApplicationLayoutLoader realLoader = new DefaultApplicationLayoutLoader();

    @BeforeEach
    public void setUp() {
        repository.deleteAll();
    }

    @Test
    public void getApplicationLayout_noLayoutExists_returns200WithDefaultLayout() throws Exception {
        when(mockLoader.getDefaultLayout()).thenReturn(realLoader.getDefaultLayout());

        mockMvc.perform(get(BASE_URL).header("username", "new user"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.username", nullValue()))
                // Expecting application layout as defined in /test/resources/defaultApplicationLayout.json
                .andExpect(jsonPath("$.definition.defaultLayoutKey", is("default-layout-value")));
    }

    @Test
    public void getApplicationLayout_defaultFailsToLoad_returns500() throws Exception {
        String errorMessage = "Failed to read default application layout";
        doThrow(new InternalServerErrorException(errorMessage)).when(mockLoader).getDefaultLayout();

        mockMvc.perform(get(BASE_URL).header("username", "new user"))
                .andExpect(status().isInternalServerError())
                .andExpect(jsonPath("$.messages", iterableWithSize(1)))
                .andExpect(jsonPath("$.messages", contains(errorMessage)));
    }

    @Test
    public void getApplicationLayout_noUserInHeader_returns400() throws Exception {
        String actualError = mockMvc.perform(get(BASE_URL))
                .andExpect(status().isBadRequest())
                .andReturn().getResponse().getErrorMessage();

        assertThat(actualError).isEqualTo(MISSING_USERNAME_ERROR_MESSAGE);
    }

    @Test
    public void getApplicationLayout_layoutExists_returns200WithPersistedLayout() throws Exception {
        String user = "user";

        Map<String, String> definition = new HashMap<>();
        definition.put("defKey", "defVal");

        persistApplicationLayout(user, definition);

        mockMvc.perform(get(BASE_URL).header("username", user))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.username", is(user)))
                .andExpect(jsonPath("$.definition", is(definition)));
    }

    @Test
    public void persistApplicationLayout_noLayoutExists_returns201AndPersistsLayout() throws Exception {
        String user = "user";
        String definition = "{\"key\": \"value\"}";

        mockMvc.perform(put(BASE_URL).header("username", user)
                        .content(definition)
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$").doesNotExist());

        ApplicationLayout persistedLayout = repository.findById(user).orElseThrow();

        assertThat(persistedLayout.getUsername()).isEqualTo(user);
        assertThat(persistedLayout.getDefinition()).isEqualTo(objectMapper.readTree(definition));
    }

    @Test
    public void persistApplicationLayout_layoutExists_returns201AndOverwritesLayout() throws Exception {
        String user = "user";

        Map<String, String> initialDefinition = new HashMap<>();
        initialDefinition.put("initial-key", "initial-value");

        persistApplicationLayout(user, initialDefinition);

        String newDefinition = "{\"new-key\": \"new-value\"}";

        mockMvc.perform(put(BASE_URL).header("username", user)
                        .content(newDefinition)
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$").doesNotExist());

        assertThat(repository.findAll()).hasSize(1);

        ApplicationLayout retrievedLayout = repository.findById(user).orElseThrow();

        assertThat(retrievedLayout.getUsername()).isEqualTo(user);
        assertThat(retrievedLayout.getDefinition()).isEqualTo(objectMapper.readTree(newDefinition));
    }

    @Test
    public void persistApplicationLayout_noUserInHeader_returns400() throws Exception {
        String actualError = mockMvc.perform(put(BASE_URL))
                .andExpect(status().isBadRequest())
                .andReturn().getResponse().getErrorMessage();

        assertThat(actualError).isEqualTo(MISSING_USERNAME_ERROR_MESSAGE);
    }

    @Test
    void persistApplicationLayout_definitionIsNotValidJSON_returns400AndDoesNotPersistLayout()
        throws Exception {
        String user = "user";
        String layoutRequestString =
            "{\n"
                + "  \"definition\": invalidJson,\n"
                + "  \"metadata\": {\n"
                + "    \"name\": \"string\",\n"
                + "    \"group\": \"string\",\n"
                + "    \"screenshot\": \"string\",\n"
                + "    \"user\": \"string\"\n"
                + "  }\n"
                + "}";

        mockMvc.perform(put(BASE_URL).header("username", user)
                .content(layoutRequestString)
                .contentType(MediaType.APPLICATION_JSON))
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.messages", iterableWithSize(1)))
            .andExpect(jsonPath("$.messages", contains(
                "JSON parse error: Unrecognized token 'invalidJson': was expecting (JSON String, "
                    + "Number, Array, Object or token 'null', 'true' or 'false'); nested "
                    + "exception is com.fasterxml.jackson.core.JsonParseException: Unrecognized "
                    + "token 'invalidJson': was expecting (JSON String, Number, Array, Object or "
                    + "token 'null', 'true' or 'false')\n at [Source: (org.springframework.util"
                    + ".StreamUtils$NonClosingInputStream); line: 2, column: 29]")));

        assertThat(repository.findAll()).isEmpty();
    }

    @Test
    public void deleteApplicationLayout_noLayoutExists_returns404() throws Exception {
        String user = "user";

        mockMvc.perform(delete(BASE_URL).header("username", user))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.messages", iterableWithSize(1)))
                .andExpect(jsonPath("$.messages", contains("No layout found for user: " + user)));
    }

    @Test
    public void deleteApplicationLayout_layoutExists_returns204AndDeletesLayout() throws Exception {
        String user = "user";

        Map<String, String> initialDefinition = new HashMap<>();
        initialDefinition.put("initial-key", "initial-value");

        persistApplicationLayout(user, initialDefinition);

        mockMvc.perform(delete(BASE_URL).header("username", user))
                .andExpect(status().isNoContent())
                .andExpect(jsonPath("$").doesNotExist());

        assertThat(repository.findAll()).hasSize(0);
    }

    @Test
    public void deleteApplicationLayout_noUserInHeader_returns400() throws Exception {
        String actualError = mockMvc.perform(delete(BASE_URL))
                .andExpect(status().isBadRequest())
                .andReturn().getResponse().getErrorMessage();

        assertThat(actualError).isEqualTo(MISSING_USERNAME_ERROR_MESSAGE);
    }

    private void persistApplicationLayout(String user, Map<String, String> definition) {
        repository.save(new ApplicationLayout(user, objectMapper.convertValue(definition, ObjectNode.class)));
    }
}
