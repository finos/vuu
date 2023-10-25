package org.finos.vuu.layoutserver.integration;

import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.anyOf;
import static org.hamcrest.Matchers.equalTo;
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
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
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
    void getMetadata_metadataExists_returnsMetadata() throws Exception {
        Layout layout = createDefaultLayoutInDatabase();

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
    void getMetadata_metadataDoesNotExist_returnsEmptyList() throws Exception {
        mockMvc.perform(get("/layouts/metadata"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$").isEmpty());
    }

    @Test
    void createLayout_validLayout_returnsCreatedLayoutAndLayoutIsPersisted()
        throws Exception {
        LayoutRequestDTO layoutRequest = createValidLayoutRequest();

        MvcResult result = mockMvc.perform(post("/layouts")
                .content(objectMapper.writeValueAsString(layoutRequest))
                .contentType(MediaType.APPLICATION_JSON))
            .andExpect(status().isCreated())
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
            JsonPath.read(result.getResponse().getContentAsString(), "$.metadata.id"));
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
    void createLayout_invalidLayout_returns400() throws Exception {
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
    void createLayout_validLayoutButInvalidMetadata_returns400AndDoesNotCreateLayout()
        throws Exception {
        LayoutRequestDTO layoutRequest = createValidLayoutRequest();
        layoutRequest.setMetadata(null);

        mockMvc.perform(post("/layouts")
                .content(objectMapper.writeValueAsString(layoutRequest))
                .contentType(MediaType.APPLICATION_JSON))
            .andExpect(status().isBadRequest())
            .andExpect(content().string(
                "Validation failed for argument [0] in public org.finos.vuu.layoutserver.dto"
                    + ".response.LayoutResponseDTO org.finos.vuu.layoutserver.controller"
                    + ".LayoutController.createLayout(org.finos.vuu.layoutserver.dto.request"
                    + ".LayoutRequestDTO): [Field error in object 'layoutRequestDTO' on field "
                    + "'metadata': rejected value [null]; codes [NotNull.layoutRequestDTO"
                    + ".metadata,NotNull.metadata,NotNull.org.finos.vuu.layoutserver.dto.request"
                    + ".MetadataRequestDTO,NotNull]; arguments [org.springframework.context"
                    + ".support.DefaultMessageSourceResolvable: codes [layoutRequestDTO.metadata,"
                    + "metadata]; arguments []; default message [metadata]]; default message "
                    + "[Please provide valid metadata]] "));

        assertThat(layoutRepository.findAll()).isEmpty();
    }

    @Test
    void updateLayout_validIDAndValidRequest_returns204AndLayoutHasChanged() throws Exception {
        Layout layout = createDefaultLayoutInDatabase();
        LayoutRequestDTO layoutRequest = createValidLayoutRequest();

        mockMvc.perform(put("/layouts/{id}", layout.getId())
                .content(objectMapper.writeValueAsString(layoutRequest))
                .contentType(MediaType.APPLICATION_JSON))
            .andExpect(status().isNoContent())
            .andExpect(jsonPath("$").doesNotExist());

        Layout updatedLayout = layoutRepository.findById(layout.getId()).orElseThrow();

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
            .andExpect(status().isBadRequest())
            .andExpect(content().string(anyOf(
                equalTo(
                    "Validation failed for argument [1] in public void org.finos.vuu.layoutserver"
                        + ".controller.LayoutController.updateLayout(java.util.UUID,org.finos.vuu"
                        + ".layoutserver.dto.request.LayoutRequestDTO) with 2 errors: [Field "
                        + "error in"
                        + " object 'layoutRequestDTO' on field 'metadata': rejected value [null]; "
                        + "codes [NotNull.layoutRequestDTO.metadata,NotNull.metadata,NotNull.org"
                        + ".finos.vuu.layoutserver.dto.request.MetadataRequestDTO,NotNull]; "
                        + "arguments"
                        + " [org.springframework.context.support.DefaultMessageSourceResolvable: "
                        + "codes [layoutRequestDTO.metadata,metadata]; arguments []; default "
                        + "message "
                        + "[metadata]]; default message [Please provide valid metadata]] [Field "
                        + "error"
                        + " in object 'layoutRequestDTO' on field 'definition': rejected value []; "
                        + "codes [NotBlank.layoutRequestDTO.definition,NotBlank.definition,NotBlank"
                        + ".java.lang.String,NotBlank]; arguments [org.springframework.context"
                        + ".support.DefaultMessageSourceResolvable: codes [layoutRequestDTO"
                        + ".definition,definition]; arguments []; default message [definition]]; "
                        + "default message [Please provide a valid definition]] "),
                equalTo(
                    "Validation failed for argument [1] in public void org.finos.vuu.layoutserver"
                        + ".controller.LayoutController.updateLayout(java.util.UUID,org.finos.vuu"
                        + ".layoutserver.dto.request.LayoutRequestDTO) with 2 errors: [Field "
                        + "error"
                        + " in object 'layoutRequestDTO' on field 'definition': rejected value []; "
                        + "codes [NotBlank.layoutRequestDTO.definition,NotBlank.definition,NotBlank"
                        + ".java.lang.String,NotBlank]; arguments [org.springframework.context"
                        + ".support.DefaultMessageSourceResolvable: codes [layoutRequestDTO"
                        + ".definition,definition]; arguments []; default message [definition]]; "
                        + "default message [Please provide a valid definition]] [Field "
                        + "error in"
                        + " object 'layoutRequestDTO' on field 'metadata': rejected value [null]; "
                        + "codes [NotNull.layoutRequestDTO.metadata,NotNull.metadata,NotNull.org"
                        + ".finos.vuu.layoutserver.dto.request.MetadataRequestDTO,NotNull]; "
                        + "arguments"
                        + " [org.springframework.context.support.DefaultMessageSourceResolvable: "
                        + "codes [layoutRequestDTO.metadata,metadata]; arguments []; default "
                        + "message "
                        + "[metadata]]; default message [Please provide valid metadata]] "))));

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
    void deleteLayout_validIDLayoutExists_returnsSuccessAndLayoutIsDeleted() throws Exception {
        Layout layout = createDefaultLayoutInDatabase();

        mockMvc.perform(get("/layouts/{id}", layout.getId())).andExpect(status().isOk());

        mockMvc.perform(delete("/layouts/{id}", layout.getId())).andExpect(status().isNoContent());

        mockMvc.perform(get("/layouts/{id}", layout.getId())).andExpect(status().isNotFound());
    }

    @Test
    void deleteLayout_validIDLayoutDoesNotExist_returnsNotFound() throws Exception {
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
        UUID id = UUID.randomUUID();
        Layout layout = new Layout();
        Metadata metadata = new Metadata();
        BaseMetadata baseMetadata = new BaseMetadata();

        baseMetadata.setName(defaultName);
        baseMetadata.setGroup(defaultGroup);
        baseMetadata.setScreenshot(defaultScreenshot);
        baseMetadata.setUser(defaultUser);

        metadata.setBaseMetadata(baseMetadata);
        metadata.setId(id);

        layout.setDefinition(defaultDefinition);
        layout.setMetadata(metadata);
        layout.setId(id);

        metadataRepository.save(metadata);
        Layout createdLayout = layoutRepository.save(layout);

        assertThat(layoutRepository.findById(createdLayout.getId()).orElseThrow())
            .isEqualTo(layout);

        return createdLayout;
    }

    private LayoutRequestDTO createValidLayoutRequest() {
        BaseMetadata baseMetadata = new BaseMetadata();
        baseMetadata.setName(defaultName);
        baseMetadata.setGroup(defaultGroup);
        baseMetadata.setScreenshot(defaultScreenshot);
        baseMetadata.setUser(defaultUser);

        MetadataRequestDTO metadataRequest = new MetadataRequestDTO();
        metadataRequest.setBaseMetadata(baseMetadata);

        LayoutRequestDTO layoutRequest = new LayoutRequestDTO();
        layoutRequest.setDefinition(defaultDefinition);
        layoutRequest.setMetadata(metadataRequest);

        return layoutRequest;
    }
}
