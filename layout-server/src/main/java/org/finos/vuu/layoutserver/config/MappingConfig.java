package org.finos.vuu.layoutserver.config;

import lombok.RequiredArgsConstructor;
import org.finos.vuu.layoutserver.dto.request.LayoutRequestDto;
import org.finos.vuu.layoutserver.model.Layout;
import org.modelmapper.ModelMapper;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@RequiredArgsConstructor
@Configuration
public class MappingConfig {

    @Bean
    public ModelMapper modelMapper() {
        ModelMapper mapper = new ModelMapper();

        mapper.typeMap(LayoutRequestDto.class, Layout.class)
                .addMappings(m -> m.skip(Layout::setId));

        return mapper;
    }
}
