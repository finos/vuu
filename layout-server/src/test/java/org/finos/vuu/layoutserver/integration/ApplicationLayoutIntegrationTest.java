package org.finos.vuu.layoutserver.integration;

import org.finos.vuu.layoutserver.model.ApplicationLayout;
import org.finos.vuu.layoutserver.repository.ApplicationLayoutRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import java.util.HashMap;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.is;
import static org.hamcrest.Matchers.nullValue;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
public class ApplicationLayoutIntegrationTest {
    @Autowired
    private MockMvc mockMvc;
    @Autowired
    private ApplicationLayoutRepository repository;

    @Test
    public void getApplicationLayout_noLayoutExists_returns200WithDefaultLayout() throws Exception {
        mockMvc.perform(get("/application-layouts").header("user", "new user"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.user", nullValue()))
                // Expecting application layout as defined in /test/resources/defaultLayout.json
                .andExpect(jsonPath("$.definition.defaultLayoutKey", is("default-layout-value")));
    }

    @Test
    public void getApplicationLayout_layoutExists_returns200WithPersistedLayout() throws Exception {
        String user = "user";

        Map<String, String> definition = new HashMap<>();
        definition.put("defKey", "defVal");

        persistApplicationLayout(user, definition);

        mockMvc.perform(get("/application-layouts").header("user", user))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.user", is(user)))
                .andExpect(jsonPath("$.definition", is(definition)));
    }

    @Test
    public void createApplicationLayout_noLayoutExists_returns201AndPersistsLayout() throws Exception {
        String user = "user";
        String definition = "{\"key\":\"value\"}";

        mockMvc.perform(post("/application-layouts")
                        .header("user", user)
                        .content(definition)
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$").doesNotExist());

        ApplicationLayout persistedLayout = repository.findById(user).orElseThrow();

        assertThat(persistedLayout.getUsername()).isEqualTo(user);
        assertThat(persistedLayout.extractDefinition()).isEqualTo(definition);
    }

    @Test
    public void createApplicationLayout_layoutExists_returns201AndOverwritesLayout() throws Exception {
        String user = "user";

        Map<String, String> initialDefinition = new HashMap<>();
        initialDefinition.put("initial-key", "initial-value");

        persistApplicationLayout(user, initialDefinition);

        String newDefinition = "{\"new-key\":\"new-value\"}";

        mockMvc.perform(post("/application-layouts")
                        .header("user", user)
                        .content(newDefinition)
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$").doesNotExist());

        assertThat(repository.findAll()).hasSize(1);

        ApplicationLayout retrievedLayout = repository.findById(user).orElseThrow();

        assertThat(retrievedLayout.getUsername()).isEqualTo(user);
        assertThat(retrievedLayout.extractDefinition()).isEqualTo(newDefinition);
    }

    @Test
    public void updateApplicationLayout_noLayoutExists_returns204AndPersistsLayout() throws Exception {
        String user = "user";
        String definition = "{\"key\":\"value\"}";

        mockMvc.perform(put("/application-layouts")
                        .header("user", user)
                        .content(definition)
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isNoContent())
                .andExpect(jsonPath("$").doesNotExist());

        ApplicationLayout persistedLayout = repository.findById(user).orElseThrow();

        assertThat(persistedLayout.getUsername()).isEqualTo(user);
        assertThat(persistedLayout.extractDefinition()).isEqualTo(definition);
    }

    @Test
    public void updateApplicationLayout_layoutExists_returns204AndOverwritesLayout() throws Exception {
        String user = "user";

        Map<String, String> initialDefinition = new HashMap<>();
        initialDefinition.put("initial-key", "initial-value");

        persistApplicationLayout(user, initialDefinition);

        String newDefinition = "{\"new-key\":\"new-value\"}";

        mockMvc.perform(put("/application-layouts")
                        .header("user", user)
                        .content(newDefinition)
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isNoContent())
                .andExpect(jsonPath("$").doesNotExist());

        assertThat(repository.findAll()).hasSize(1);

        ApplicationLayout retrievedLayout = repository.findById(user).orElseThrow();

        assertThat(retrievedLayout.getUsername()).isEqualTo(user);
        assertThat(retrievedLayout.extractDefinition()).isEqualTo(newDefinition);
    }

    @Test
    public void deleteApplicationLayout_noLayoutExists_returns404() throws Exception {
        String user = "user";

        String response = mockMvc.perform(delete("/application-layouts")
                        .header("user", user))
                .andExpect(status().isNotFound())
                .andReturn().getResponse().getContentAsString();

        assertThat(response).isEqualTo("No layout found for user: " + user);
    }

    @Test
    public void deleteApplicationLayout_layoutExists_returns204AndDeletesLayout() throws Exception {
        String user = "user";

        Map<String, String> initialDefinition = new HashMap<>();
        initialDefinition.put("initial-key", "initial-value");

        persistApplicationLayout(user, initialDefinition);

        mockMvc.perform(delete("/application-layouts")
                        .header("user", user))
                .andExpect(status().isNoContent())
                .andExpect(jsonPath("$").doesNotExist());

        assertThat(repository.findAll()).hasSize(0);
    }

    private void persistApplicationLayout(String user, Map<String, String> definition) {
        StringBuilder defBuilder = new StringBuilder("{");
        definition.forEach((k, v) -> defBuilder.append("\"").append(k).append("\":\"").append(v).append("\""));
        defBuilder.append("}");

        ApplicationLayout appLayout = new ApplicationLayout(user, defBuilder.toString());
        repository.save(appLayout);
    }
}
