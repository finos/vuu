package org.finos.vuu.layoutserver.service;

import lombok.RequiredArgsConstructor;
import org.finos.vuu.layoutserver.model.Metadata;
import org.finos.vuu.layoutserver.repository.MetadataRepository;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

@RequiredArgsConstructor
@Service
public class MetadataService {

    private final MetadataRepository metadataRepository;

    public List<Metadata> getMetadata() {
        List<Metadata> metadata = new ArrayList<>();

        metadataRepository.findAll().forEach(metadata::add);

        return metadata;
    }
}
