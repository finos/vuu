package org.finos.vuu.layoutserver.integration;

import static org.assertj.core.api.AssertionsForClassTypes.assertThat;
import static org.hamcrest.Matchers.is;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.fasterxml.jackson.databind.ObjectMapper;
import java.util.Date;
import java.util.UUID;
import org.finos.vuu.layoutserver.dto.request.LayoutRequestDTO;
import org.finos.vuu.layoutserver.dto.request.MetadataRequestDTO;
import org.finos.vuu.layoutserver.model.Layout;
import org.finos.vuu.layoutserver.model.Metadata;
import org.finos.vuu.layoutserver.repository.LayoutRepository;
import org.finos.vuu.layoutserver.repository.MetadataRepository;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

@SpringBootTest
@AutoConfigureMockMvc
@Transactional
@ActiveProfiles("test")
public class LayoutIntegrationTest {

    private static String defaultDefinition;
    private static String defaultName;
    private static String defaultGroup;
    private static String defaultScreenshot;
    private static String defaultUser;
    private final ObjectMapper objectMapper = new ObjectMapper();
    @Autowired
    private MockMvc mockMvc;
    @Autowired
    private LayoutRepository layoutRepository;
    @Autowired
    private MetadataRepository metadataRepository;

    @BeforeAll
    public static void setup() {
        defaultDefinition = "Default layout definition";
        defaultName = "Default layout name";
        defaultGroup = "Default layout group";
        defaultScreenshot = "Default layout screenshot";
        defaultUser = "Default layout user";
    }

    @Test
    void getLayout_validIDAndLayoutExists_returns200WithLayout() throws Exception {
        Layout layout = createDefaultLayoutInDatabase();

        mockMvc.perform(get("/layouts/{id}", layout.getId()))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.definition", is(layout.getDefinition())))
            .andExpect(jsonPath("$.metadata.name", is(layout.getMetadata().getName())))
            .andExpect(jsonPath("$.metadata.group", is(layout.getMetadata().getGroup())))
            .andExpect(jsonPath("$.metadata.screenshot", is(layout.getMetadata().getScreenshot())))
            .andExpect(jsonPath("$.metadata.user", is(layout.getMetadata().getUser())));
    }

    @Test
    void getLayout_validIDButLayoutDoesNotExist_returns404() throws Exception {
        UUID layoutID = UUID.randomUUID();

        mockMvc.perform(get("/layouts/{id}", layoutID)).andExpect(status().isNotFound());
    }

    @Test
    void getLayout_invalidId_returns400() throws Exception {
        String layoutID = "invalidUUID";

        mockMvc.perform(get("/layouts/{id}", layoutID)).andExpect(status().isBadRequest());
    }

    @Test
    void getMetadata_metadataExists_returnsMetadata() throws Exception {
        Layout layout = createDefaultLayoutInDatabase();

        mockMvc.perform(get("/layouts/metadata"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$[0].name", is(layout.getMetadata().getName())))
            .andExpect(jsonPath("$[0].group", is(layout.getMetadata().getGroup())))
            .andExpect(jsonPath("$[0].screenshot", is(layout.getMetadata().getScreenshot())))
            .andExpect(jsonPath("$[0].user", is(layout.getMetadata().getUser())));
    }

    @Test
    void getMetadata_metadataDoesNotExist_returnsEmptyList() throws Exception {
        mockMvc.perform(get("/layouts/metadata"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$").isEmpty());
    }

    @Test
    void createLayout_validLayout_returnsLayoutCreatedWithIDAndCreatedDate() throws Exception {
        MetadataRequestDTO metadataRequest = new MetadataRequestDTO();
        metadataRequest.setName(defaultName);
        metadataRequest.setGroup(defaultGroup);
        metadataRequest.setScreenshot(defaultScreenshot);
        metadataRequest.setUser(defaultUser);

        LayoutRequestDTO layoutRequest = new LayoutRequestDTO();
        layoutRequest.setDefinition(defaultDefinition);
        layoutRequest.setMetadata(metadataRequest);

        mockMvc.perform(post("/layouts")
                .content(objectMapper.writeValueAsString(layoutRequest))
                .contentType(MediaType.APPLICATION_JSON))
            .andExpect(status().isCreated())
            .andExpect(jsonPath("$.id").isNotEmpty())
            .andExpect(jsonPath("$.created").isNotEmpty());
    }

    @Test
    void createLayout_invalidLayout_returns400() throws Exception {
        String invalidLayout = "invalidLayout";

        mockMvc.perform(post("/layouts")
                .content(invalidLayout)
                .contentType(MediaType.APPLICATION_JSON))
            .andExpect(status().isBadRequest());
    }

    @Test
    void updateLayout_validIDAndValidRequest_returns204AndLayoutHasChanged() throws Exception {
        Layout layout = createDefaultLayoutInDatabase();
        LayoutRequestDTO layoutRequest = createValidUpdateRequest();

        mockMvc.perform(put("/layouts/{id}", layout.getId())
                .content(objectMapper.writeValueAsString(layoutRequest))
                .contentType(MediaType.APPLICATION_JSON))
            .andExpect(status().isNoContent())
            .andExpect(jsonPath("$").doesNotExist());

        Layout updatedLayout = layoutRepository.findById(layout.getId()).orElseThrow();

        assertThat(updatedLayout.getDefinition())
            .isEqualTo(layoutRequest.getDefinition());
        assertThat(updatedLayout.getMetadata().getName())
            .isEqualTo(layoutRequest.getMetadata().getName());
        assertThat(updatedLayout.getMetadata().getGroup())
            .isEqualTo(layoutRequest.getMetadata().getGroup());
        assertThat(updatedLayout.getMetadata().getScreenshot())
            .isEqualTo(layoutRequest.getMetadata().getScreenshot());
        assertThat(updatedLayout.getMetadata().getUser())
            .isEqualTo(layoutRequest.getMetadata().getUser());
    }

    @Test
    void updateLayout_invalidRequestBodyDefinitionIsBlankAndMetadataIsNull_returns400AndLayoutDoesNotChange()
        throws Exception {
        Layout layout = createDefaultLayoutInDatabase();

        LayoutRequestDTO request = new LayoutRequestDTO();
        request.setDefinition("");
        request.setMetadata(null);

        mockMvc.perform(put("/layouts/{id}", layout.getId())
                .content(objectMapper.writeValueAsString(request))
                .contentType(MediaType.APPLICATION_JSON))
            .andExpect(status().isBadRequest());

        assertThat(layoutRepository.findById(layout.getId()).orElseThrow()).isEqualTo(layout);
    }

    @Test
    void updateLayout_invalidRequestBodyUnexpectedFormat_returns400AndLayoutDoesNotChange()
        throws Exception {
        Layout layout = createDefaultLayoutInDatabase();
        String request = "invalidRequest";

        mockMvc.perform(put("/layouts/{id}", layout.getId())
                .content(objectMapper.writeValueAsString(request))
                .contentType(MediaType.APPLICATION_JSON))
            .andExpect(status().isBadRequest());

        assertThat(layoutRepository.findById(layout.getId()).orElseThrow()).isEqualTo(layout);
    }

    //    TODO Update layout, invalid ID, returns 400
    @Test
    void updateLayout_validIdButLayoutDoesNotExist_returnsNotFound() throws Exception {
        UUID layoutID = UUID.randomUUID();
        LayoutRequestDTO layoutRequest = createValidUpdateRequest();

        mockMvc.perform(put("/layouts/{id}", layoutID)
                .content(objectMapper.writeValueAsString(layoutRequest))
                .contentType(MediaType.APPLICATION_JSON))
            .andExpect(status().isNotFound());
    }

    @Test
    void updateLayout_invalidId_returns400() throws Exception {
        String layoutID = "invalidUUID";
        LayoutRequestDTO layoutRequest = createValidUpdateRequest();

        mockMvc.perform(put("/layouts/{id}", layoutID)
                .content(objectMapper.writeValueAsString(layoutRequest))
                .contentType(MediaType.APPLICATION_JSON))
            .andExpect(status().isBadRequest());
    }

    @Test
    void deleteLayout_validIDLayoutExists_returnsSuccessAndLayoutIsDeleted() throws Exception {
        Layout layout = createDefaultLayoutInDatabase();

        mockMvc.perform(get("/layouts/{id}", layout.getId()))
            .andExpect(status().isOk());

        mockMvc.perform(delete("/layouts/{id}", layout.getId()))
            .andExpect(status().isNoContent());

        mockMvc.perform(get("/layouts/{id}", layout.getId()))
            .andExpect(status().isNotFound());
    }

    @Test
    void deleteLayout_validIDLayoutDoesNotExist_returnsNotFound() throws Exception {
        UUID layoutID = UUID.randomUUID();

        mockMvc.perform(delete("/layouts/{id}", layoutID))
            .andExpect(status().isNotFound());
    }

    @Test
    void deleteLayout_invalidId_returns400() throws Exception {
        String layoutID = "invalidUUID";

        mockMvc.perform(delete("/layouts/{id}", layoutID))
            .andExpect(status().isBadRequest());
    }

    private Layout createDefaultLayoutInDatabase() {
        Layout layout = new Layout();
        Metadata metadata = new Metadata();

        layout.setDefinition(defaultDefinition);
        layout.setMetadata(metadata);

        metadata.setLayout(layout);
        metadata.setName(defaultName);
        metadata.setGroup(defaultGroup);
        metadata.setScreenshot(defaultScreenshot);
        metadata.setUser(defaultUser);

        metadataRepository.save(metadata);
        Layout createdLayout = layoutRepository.save(layout);

        assertThat(layoutRepository.findById(createdLayout.getId()).orElseThrow())
            .isEqualTo(layout);

        return createdLayout;
    }

    private LayoutRequestDTO createValidUpdateRequest() {
        MetadataRequestDTO metadataRequest = new MetadataRequestDTO();
        metadataRequest.setName("Updated name");
        metadataRequest.setGroup("Updated group");
        metadataRequest.setScreenshot("Updated screenshot");
        metadataRequest.setUser("Updated user");

        LayoutRequestDTO layoutRequest = new LayoutRequestDTO();
        layoutRequest.setDefinition("Updated definition");
        layoutRequest.setMetadata(metadataRequest);
        return layoutRequest;
    }

}
