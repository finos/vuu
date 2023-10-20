package org.finos.vuu.layoutserver.config;

import org.finos.vuu.layoutserver.dto.request.LayoutRequestDto;
import org.finos.vuu.layoutserver.dto.request.MetadataRequestDto;
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

        mapper.typeMap(LayoutRequestDto.class, Layout.class)
            .addMappings(m -> m.skip(Layout::setId));

        mapper.typeMap(MetadataRequestDto.class, Metadata.class)
            .addMappings(m -> m.skip(Metadata::setId));

        return mapper;
    }
}
