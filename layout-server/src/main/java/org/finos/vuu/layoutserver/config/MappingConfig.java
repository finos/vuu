package org.finos.vuu.layoutserver.config;

import lombok.RequiredArgsConstructor;
import org.finos.vuu.layoutserver.dto.request.LayoutRequestDto;
import org.finos.vuu.layoutserver.dto.response.MetadataResponseDto;
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

        mapper.typeMap(LayoutRequestDto.class, Layout.class)
            .addMappings(m -> m.skip(Layout::setId));

        mapper.typeMap(Metadata.class, MetadataResponseDto.class)
            .addMappings(m -> m.map(
                metadata -> layoutService.getLayoutByMetadataId(metadata.getId()),
                MetadataResponseDto::setLayoutId));

        return mapper;
    }
}
