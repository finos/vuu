package org.finos.vuu.layoutserver.integration;

import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.is;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.jayway.jsonpath.JsonPath;
import java.util.UUID;
import org.finos.vuu.layoutserver.dto.request.LayoutRequestDTO;
import org.finos.vuu.layoutserver.dto.request.MetadataRequestDTO;
import org.finos.vuu.layoutserver.model.BaseMetadata;
import org.finos.vuu.layoutserver.model.Layout;
import org.finos.vuu.layoutserver.model.Metadata;
import org.finos.vuu.layoutserver.repository.LayoutRepository;
import org.finos.vuu.layoutserver.repository.MetadataRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
public class LayoutIntegrationTest {

    private static final String DEFAULT_LAYOUT_DEFINITION = "Default layout definition";
    private static final String DEFAULT_LAYOUT_NAME = "Default layout name";
    private static final String DEFAULT_LAYOUT_GROUP = "Default layout group";
    private static final String DEFAULT_LAYOUT_SCREENSHOT = "Default layout screenshot";
    private static final String DEFAULT_LAYOUT_USER = "Default layout user";

    private final ObjectMapper objectMapper = new ObjectMapper();

    @Autowired
    private MockMvc mockMvc;
    @Autowired
    private LayoutRepository layoutRepository;
    @Autowired
    private MetadataRepository metadataRepository;

    @BeforeEach
    void tearDown() {
        layoutRepository.deleteAll();
        metadataRepository.deleteAll();
    }

    @Test
    void getLayout_validIDAndLayoutExists_returns200WithLayout() throws Exception {
        Layout layout = createDefaultLayoutInDatabase();
        assertThat(layoutRepository.findById(layout.getId()).orElseThrow()).isEqualTo(layout);

        mockMvc.perform(get("/layouts/{id}", layout.getId()))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.definition",
                is(layout.getDefinition())))
            .andExpect(jsonPath("$.metadata.name",
                is(layout.getMetadata().getBaseMetadata().getName())))
            .andExpect(jsonPath("$.metadata.group",
                is(layout.getMetadata().getBaseMetadata().getGroup())))
            .andExpect(jsonPath("$.metadata.screenshot",
                is(layout.getMetadata().getBaseMetadata().getScreenshot())))
            .andExpect(jsonPath("$.metadata.user",
                is(layout.getMetadata().getBaseMetadata().getUser())));
    }

    @Test
    void getLayout_validIDButLayoutDoesNotExist_returns404() throws Exception {
        UUID layoutID = UUID.randomUUID();

        mockMvc.perform(get("/layouts/{id}", layoutID)).andExpect(status().isNotFound());
    }

    @Test
    void getLayout_invalidId_returns400() throws Exception {
        String layoutID = "invalidUUID";

        mockMvc.perform(get("/layouts/{id}", layoutID))
            .andExpect(status().isBadRequest())
            .andExpect(content().string(
                "Failed to convert value of type 'java.lang.String' to required type 'java.util"
                    + ".UUID'; nested exception is java.lang.IllegalArgumentException: Invalid "
                    + "UUID string: invalidUUID"));
    }

    @Test
    void getMetadata_singleMetadataExists_returnsMetadata() throws Exception {
        Layout layout = createDefaultLayoutInDatabase();
        assertThat(layoutRepository.findById(layout.getId()).orElseThrow()).isEqualTo(layout);

        mockMvc.perform(get("/layouts/metadata"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$[0].name",
                is(layout.getMetadata().getBaseMetadata().getName())))
            .andExpect(jsonPath("$[0].group",
                is(layout.getMetadata().getBaseMetadata().getGroup())))
            .andExpect(jsonPath("$[0].screenshot",
                is(layout.getMetadata().getBaseMetadata().getScreenshot())))
            .andExpect(jsonPath("$[0].user",
                is(layout.getMetadata().getBaseMetadata().getUser())));
    }

    @Test
    void getMetadata_multipleMetadataExists_returnsAllMetadata() throws Exception {
        Layout layout1 = createDefaultLayoutInDatabase();
        Layout layout2 = createDefaultLayoutInDatabase();
        layout2.setDefinition("Different definition");
        layout2.getMetadata().getBaseMetadata().setName("Different name");
        layout2.getMetadata().getBaseMetadata().setGroup("Different group");
        layout2.getMetadata().getBaseMetadata().setScreenshot("Different screenshot");
        layout2.getMetadata().getBaseMetadata().setUser("Different user");
        layoutRepository.save(layout2);

        assertThat(layoutRepository.findById(layout1.getId()).orElseThrow()).isEqualTo(layout1);
        assertThat(layoutRepository.findById(layout2.getId()).orElseThrow()).isEqualTo(layout2);

        mockMvc.perform(get("/layouts/metadata"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$[0].name",
                is(layout1.getMetadata().getBaseMetadata().getName())))
            .andExpect(jsonPath("$[0].group",
                is(layout1.getMetadata().getBaseMetadata().getGroup())))
            .andExpect(jsonPath("$[0].screenshot",
                is(layout1.getMetadata().getBaseMetadata().getScreenshot())))
            .andExpect(jsonPath("$[0].user",
                is(layout1.getMetadata().getBaseMetadata().getUser())))
            .andExpect(jsonPath("$[1].name",
                is(layout2.getMetadata().getBaseMetadata().getName())))
            .andExpect(jsonPath("$[1].group",
                is(layout2.getMetadata().getBaseMetadata().getGroup())))
            .andExpect(jsonPath("$[1].screenshot",
                is(layout2.getMetadata().getBaseMetadata().getScreenshot())))
            .andExpect(jsonPath("$[1].user",
                is(layout2.getMetadata().getBaseMetadata().getUser())));
    }

    @Test
    void getMetadata_metadataDoesNotExist_returnsEmptyList() throws Exception {
        mockMvc.perform(get("/layouts/metadata"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$").isEmpty());
    }

    @Test
    void createLayout_validRequest_returnsCreatedLayoutAndLayoutIsPersisted()
        throws Exception {
        LayoutRequestDTO layoutRequest = createValidLayoutRequest();

        MvcResult result = mockMvc.perform(post("/layouts")
                .content(objectMapper.writeValueAsString(layoutRequest))
                .contentType(MediaType.APPLICATION_JSON))
            .andExpect(status().isCreated())
            .andExpect(jsonPath("$.id").isNotEmpty())
            .andExpect(jsonPath("$.definition", is(layoutRequest.getDefinition())))
            .andExpect(jsonPath("$.metadata.name",
                is(layoutRequest.getMetadata().getBaseMetadata().getName())))
            .andExpect(jsonPath("$.metadata.group",
                is(layoutRequest.getMetadata().getBaseMetadata().getGroup())))
            .andExpect(jsonPath("$.metadata.screenshot",
                is(layoutRequest.getMetadata().getBaseMetadata().getScreenshot())))
            .andExpect(jsonPath("$.metadata.user",
                is(layoutRequest.getMetadata().getBaseMetadata().getUser())))
            .andReturn();

        UUID createdLayoutId = UUID.fromString(
            JsonPath.read(result.getResponse().getContentAsString(), "$.id"));
        Layout createdLayout = layoutRepository.findById(createdLayoutId).orElseThrow();
        Metadata createdMetadata = metadataRepository.findById(createdLayout.getMetadata().getId())
            .orElseThrow();

        // Check that the one-to-one relationship isn't causing duplicate/unexpected entries in
        // the DB
        assertThat(layoutRepository.findAll()).containsExactly(createdLayout);
        assertThat(metadataRepository.findAll()).containsExactly(createdMetadata);

        assertThat(createdLayout.getDefinition())
            .isEqualTo(layoutRequest.getDefinition());
        assertThat(createdMetadata.getBaseMetadata().getName())
            .isEqualTo(layoutRequest.getMetadata().getBaseMetadata().getName());
        assertThat(createdMetadata.getBaseMetadata().getGroup())
            .isEqualTo(layoutRequest.getMetadata().getBaseMetadata().getGroup());
        assertThat(createdMetadata.getBaseMetadata().getScreenshot())
            .isEqualTo(layoutRequest.getMetadata().getBaseMetadata().getScreenshot());
        assertThat(createdMetadata.getBaseMetadata().getUser())
            .isEqualTo(layoutRequest.getMetadata().getBaseMetadata().getUser());
    }

    @Test
    void createLayout_invalidRequestBodyDefinitionsIsBlank_returns400AndDoesNotCreateLayout()
        throws Exception {
        LayoutRequestDTO layoutRequest = createValidLayoutRequest();
        layoutRequest.setDefinition("");

        mockMvc.perform(post("/layouts")
                .content(objectMapper.writeValueAsString(layoutRequest))
                .contentType(MediaType.APPLICATION_JSON))
            .andExpect(status().isBadRequest())
            .andExpect(content().string(
                "[definition: Definition must not be blank]"));

        assertThat(layoutRepository.findAll()).isEmpty();
        assertThat(metadataRepository.findAll()).isEmpty();
    }

    @Test
    void createLayout_invalidRequestBodyMetadataIsNull_returns400AndDoesNotCreateLayout()
        throws Exception {
        LayoutRequestDTO layoutRequest = createValidLayoutRequest();
        layoutRequest.setMetadata(null);

        mockMvc.perform(post("/layouts")
                .content(objectMapper.writeValueAsString(layoutRequest))
                .contentType(MediaType.APPLICATION_JSON))
            .andExpect(status().isBadRequest())
            .andExpect(content().string(
                "[metadata: Metadata must not be null]"));

        assertThat(layoutRepository.findAll()).isEmpty();
        assertThat(metadataRepository.findAll()).isEmpty();
    }


    @Test
    void createLayout_invalidRequestBodyUnexpectedFormat_returns400() throws Exception {
        String invalidLayout = "invalidLayout";

        mockMvc.perform(post("/layouts")
                .content(invalidLayout)
                .contentType(MediaType.APPLICATION_JSON))
            .andExpect(status().isBadRequest())
            .andExpect(content().string(
                "JSON parse error: Unrecognized token 'invalidLayout': was expecting (JSON "
                    + "String, Number, Array, Object or token 'null', 'true' or 'false'); nested "
                    + "exception is com.fasterxml.jackson.core.JsonParseException: Unrecognized "
                    + "token 'invalidLayout': was expecting (JSON String, Number, Array, Object "
                    + "or token 'null', 'true' or 'false')\n"
                    + " at [Source: (org.springframework.util.StreamUtils$NonClosingInputStream);"
                    + " line: 1, column: 14]"));
    }

    @Test
    void updateLayout_validIdAndValidRequest_returns204AndLayoutHasChanged() throws Exception {
        Layout initialLayout = createDefaultLayoutInDatabase();
        assertThat(layoutRepository.findById(initialLayout.getId()).orElseThrow()).isEqualTo(
            initialLayout);

        LayoutRequestDTO layoutRequest = createValidLayoutRequest();
        layoutRequest.setDefinition("Updated definition");
        layoutRequest.getMetadata().getBaseMetadata().setName("Updated name");
        layoutRequest.getMetadata().getBaseMetadata().setGroup("Updated group");
        layoutRequest.getMetadata().getBaseMetadata().setScreenshot("Updated screenshot");
        layoutRequest.getMetadata().getBaseMetadata().setUser("Updated user");

        mockMvc.perform(put("/layouts/{id}", initialLayout.getId())
                .content(objectMapper.writeValueAsString(layoutRequest))
                .contentType(MediaType.APPLICATION_JSON))
            .andExpect(status().isNoContent())
            .andExpect(jsonPath("$").doesNotExist());

        Layout updatedLayout = layoutRepository.findById(initialLayout.getId()).orElseThrow();

        assertThat(updatedLayout.getDefinition())
            .isEqualTo(layoutRequest.getDefinition());
        assertThat(updatedLayout.getMetadata().getBaseMetadata().getName())
            .isEqualTo(layoutRequest.getMetadata().getBaseMetadata().getName());
        assertThat(updatedLayout.getMetadata().getBaseMetadata().getGroup())
            .isEqualTo(layoutRequest.getMetadata().getBaseMetadata().getGroup());
        assertThat(updatedLayout.getMetadata().getBaseMetadata().getScreenshot())
            .isEqualTo(layoutRequest.getMetadata().getBaseMetadata().getScreenshot());
        assertThat(updatedLayout.getMetadata().getBaseMetadata().getUser())
            .isEqualTo(layoutRequest.getMetadata().getBaseMetadata().getUser());

        assertThat(updatedLayout).isNotEqualTo(initialLayout);
    }

    @Test
    void updateLayout_invalidRequestBodyDefinitionIsBlank_returns400AndLayoutDoesNotChange()
        throws Exception {
        Layout layout = createDefaultLayoutInDatabase();
        assertThat(layoutRepository.findById(layout.getId()).orElseThrow()).isEqualTo(layout);

        LayoutRequestDTO request = createValidLayoutRequest();
        request.setDefinition("");

        mockMvc.perform(put("/layouts/{id}", layout.getId())
                .content(objectMapper.writeValueAsString(request))
                .contentType(MediaType.APPLICATION_JSON))
            .andExpect(status().isBadRequest())
            .andExpect(content().string("[definition: Definition must not be blank]"));

        assertThat(layoutRepository.findById(layout.getId()).orElseThrow()).isEqualTo(layout);
    }

    @Test
    void updateLayout_invalidRequestBodyMetadataIsNull_returns400AndLayoutDoesNotChange()
        throws Exception {
        Layout layout = createDefaultLayoutInDatabase();
        assertThat(layoutRepository.findById(layout.getId()).orElseThrow()).isEqualTo(layout);

        LayoutRequestDTO request = createValidLayoutRequest();
        request.setMetadata(null);

        mockMvc.perform(put("/layouts/{id}", layout.getId())
                .content(objectMapper.writeValueAsString(request))
                .contentType(MediaType.APPLICATION_JSON))
            .andExpect(status().isBadRequest())
            .andExpect(content().string("[metadata: Metadata must not be null]"));

        assertThat(layoutRepository.findById(layout.getId()).orElseThrow()).isEqualTo(layout);
    }

    @Test
    void updateLayout_invalidRequestBodyUnexpectedFormat_returns400AndLayoutDoesNotChange()
        throws Exception {
        Layout layout = createDefaultLayoutInDatabase();
        assertThat(layoutRepository.findById(layout.getId()).orElseThrow()).isEqualTo(layout);

        String request = "invalidRequest";

        mockMvc.perform(put("/layouts/{id}", layout.getId())
                .content(objectMapper.writeValueAsString(request))
                .contentType(MediaType.APPLICATION_JSON))
            .andExpect(status().isBadRequest())
            .andExpect(content().string(
                "JSON parse error: Cannot construct instance of `org.finos.vuu.layoutserver.dto"
                    + ".request.LayoutRequestDTO` (although at least one Creator exists): no "
                    + "String-argument constructor/factory method to deserialize from String "
                    + "value ('invalidRequest'); nested exception is com.fasterxml.jackson"
                    + ".databind.exc.MismatchedInputException: Cannot construct instance of `org"
                    + ".finos.vuu.layoutserver.dto.request.LayoutRequestDTO` (although at least "
                    + "one Creator exists): no String-argument constructor/factory method to "
                    + "deserialize from String value ('invalidRequest')\n"
                    + " at [Source: (org.springframework.util.StreamUtils$NonClosingInputStream);"
                    + " line: 1, column: 1]"));

        assertThat(layoutRepository.findById(layout.getId()).orElseThrow()).isEqualTo(
            layout);
    }

    @Test
    void updateLayout_validIdButLayoutDoesNotExist_returnsNotFound() throws Exception {
        UUID layoutID = UUID.randomUUID();
        LayoutRequestDTO layoutRequest = createValidLayoutRequest();

        mockMvc.perform(put("/layouts/{id}", layoutID)
                .content(objectMapper.writeValueAsString(layoutRequest))
                .contentType(MediaType.APPLICATION_JSON))
            .andExpect(status().isNotFound());
    }

    @Test
    void updateLayout_invalidId_returns400() throws Exception {
        String layoutID = "invalidUUID";
        LayoutRequestDTO layoutRequest = createValidLayoutRequest();

        mockMvc.perform(put("/layouts/{id}", layoutID)
                .content(objectMapper.writeValueAsString(layoutRequest))
                .contentType(MediaType.APPLICATION_JSON))
            .andExpect(status().isBadRequest())
            .andExpect(content().string(
                "Failed to convert value of type 'java.lang.String' to required type 'java.util"
                    + ".UUID'; nested exception is java.lang.IllegalArgumentException: Invalid "
                    + "UUID string: invalidUUID"));
    }

    @Test
    void deleteLayout_validIdLayoutExists_returnsSuccessAndLayoutIsDeleted() throws Exception {
        Layout layout = createDefaultLayoutInDatabase();
        assertThat(layoutRepository.findById(layout.getId()).orElseThrow()).isEqualTo(layout);

        mockMvc.perform(delete("/layouts/{id}", layout.getId())).andExpect(status().isNoContent());

        assertThat(layoutRepository.findById(layout.getId())).isEmpty();
    }

    @Test
    void deleteLayout_validIdLayoutDoesNotExist_returnsNotFound() throws Exception {
        UUID layoutID = UUID.randomUUID();

        mockMvc.perform(delete("/layouts/{id}", layoutID)).andExpect(status().isNotFound());
    }

    @Test
    void deleteLayout_invalidId_returns400() throws Exception {
        String layoutID = "invalidUUID";

        mockMvc.perform(delete("/layouts/{id}", layoutID))
            .andExpect(status().isBadRequest())
            .andExpect(content().string(
                "Failed to convert value of type 'java.lang.String' to required type 'java.util"
                    + ".UUID'; nested exception is java.lang.IllegalArgumentException: Invalid "
                    + "UUID string: invalidUUID"));
    }

    private Layout createDefaultLayoutInDatabase() {
        Layout layout = new Layout();
        Metadata metadata = new Metadata();
        BaseMetadata baseMetadata = new BaseMetadata();

        baseMetadata.setName(DEFAULT_LAYOUT_NAME);
        baseMetadata.setGroup(DEFAULT_LAYOUT_GROUP);
        baseMetadata.setScreenshot(DEFAULT_LAYOUT_SCREENSHOT);
        baseMetadata.setUser(DEFAULT_LAYOUT_USER);

        metadata.setBaseMetadata(baseMetadata);

        layout.setDefinition(DEFAULT_LAYOUT_DEFINITION);
        layout.setMetadata(metadata);

        return layoutRepository.save(layout);
    }

    private LayoutRequestDTO createValidLayoutRequest() {
        BaseMetadata baseMetadata = new BaseMetadata();
        baseMetadata.setName(DEFAULT_LAYOUT_NAME);
        baseMetadata.setGroup(DEFAULT_LAYOUT_GROUP);
        baseMetadata.setScreenshot(DEFAULT_LAYOUT_SCREENSHOT);
        baseMetadata.setUser(DEFAULT_LAYOUT_USER);

        MetadataRequestDTO metadataRequest = new MetadataRequestDTO();
        metadataRequest.setBaseMetadata(baseMetadata);

        LayoutRequestDTO layoutRequest = new LayoutRequestDTO();
        layoutRequest.setDefinition(DEFAULT_LAYOUT_DEFINITION);
        layoutRequest.setMetadata(metadataRequest);

        return layoutRequest;
    }
}
