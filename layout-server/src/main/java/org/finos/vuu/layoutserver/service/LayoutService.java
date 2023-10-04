package org.finos.vuu.layoutserver.service;

import lombok.RequiredArgsConstructor;
import org.finos.vuu.layoutserver.model.Layout;
import org.finos.vuu.layoutserver.model.Metadata;
import org.finos.vuu.layoutserver.repository.LayoutRepository;
import org.finos.vuu.layoutserver.repository.MetadataRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@RequiredArgsConstructor
@Service
public class LayoutService {

    private final LayoutRepository layoutRepository;
    private final MetadataRepository metadataRepository;

    public Layout getLayout(UUID id) {
        return layoutRepository.findById(id).orElseThrow();
    }

    public List<Metadata> getMetadata() {
        List<Metadata> metadata = new ArrayList<>();

        metadataRepository.findAll().forEach(metadata::add);

        return metadata;
    }

    @Transactional
    public UUID createLayout(Layout layout) {
        Metadata metadata = metadataRepository.save(layout.getMetadata());
        metadata.setLayout(layout);
        layout.setMetadata(metadata);
        return layoutRepository.save(layout).getId();
    }

    public void updateLayout(Layout updatedLayout) {
        layoutRepository.save(updatedLayout);
    }

    public void deleteLayout(UUID id) {
        layoutRepository.deleteById(id);
    }
}
