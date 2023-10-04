package org.finos.vuu.layoutserver.dto;

import org.finos.vuu.layoutserver.dto.request.LayoutRequestDTO;
import org.finos.vuu.layoutserver.dto.request.MetadataRequestDTO;
import org.finos.vuu.layoutserver.dto.response.CreateLayoutResponseDTO;
import org.finos.vuu.layoutserver.dto.response.MetadataResponseDTO;
import org.finos.vuu.layoutserver.model.Layout;
import org.finos.vuu.layoutserver.model.Metadata;
import org.modelmapper.ModelMapper;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class MappingConfig {

    @Bean
    public ModelMapper modelMapper() {
        ModelMapper mapper = new ModelMapper();

        // LayoutRequestDTO to Layout
        mapper.typeMap(LayoutRequestDTO.class, Layout.class).addMappings(m -> m.skip(Layout::setId));

        // Layout to CreateLayoutResponseDTO
        mapper.typeMap(Layout.class, CreateLayoutResponseDTO.class)
                .addMappings(m -> m.map(layout -> layout.getMetadata().getCreated(),
                        CreateLayoutResponseDTO::setCreated));

        // Metadata to MetadataResponseDTO
        mapper.typeMap(Metadata.class, MetadataResponseDTO.class)
                .addMappings(m -> m.map(metadata -> metadata.getLayout().getId(), MetadataResponseDTO::setLayoutId));

        // MetadataRequestDTO to Metadata
        mapper.typeMap(MetadataRequestDTO.class, Metadata.class).addMappings(m -> m.skip(Metadata::setId));

        return mapper;
    }
}
