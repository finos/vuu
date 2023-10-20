package org.finos.vuu.layoutserver.config;

import lombok.RequiredArgsConstructor;
import org.finos.vuu.layoutserver.dto.request.LayoutRequestDTO;
import org.finos.vuu.layoutserver.dto.request.MetadataRequestDTO;
import org.finos.vuu.layoutserver.dto.response.MetadataResponseDTO;
import org.finos.vuu.layoutserver.model.Layout;
import org.finos.vuu.layoutserver.model.Metadata;
import org.finos.vuu.layoutserver.service.LayoutService;
import org.modelmapper.ModelMapper;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@RequiredArgsConstructor
@Configuration
public class MappingConfig {

    private final LayoutService layoutService;

    @Bean
    public ModelMapper modelMapper() {
        ModelMapper mapper = new ModelMapper();

        mapper.typeMap(LayoutRequestDTO.class, Layout.class)
            .addMappings(m -> m.skip(Layout::setId));

        mapper.typeMap(Metadata.class, MetadataResponseDTO.class)
            .addMappings(m -> m.map(
                metadata -> layoutService.getLayoutByMetadataId(metadata.getId()),
                MetadataResponseDTO::setLayoutId));

        mapper.typeMap(MetadataRequestDTO.class, Metadata.class)
            .addMappings(m -> m.map(
                MetadataRequestDTO::getBaseMetadata,
                Metadata::setBaseMetadata));

        mapper.typeMap(Metadata.class, MetadataResponseDTO.class)
            .addMappings(m -> m.map(
                Metadata::getBaseMetadata,
                MetadataResponseDTO::setBaseMetadata));

        return mapper;
    }
}