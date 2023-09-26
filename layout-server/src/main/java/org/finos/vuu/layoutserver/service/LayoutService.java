package org.finos.vuu.layoutserver.service;

import lombok.RequiredArgsConstructor;
import org.finos.vuu.layoutserver.model.Layout;
import org.finos.vuu.layoutserver.model.Metadata;
import org.finos.vuu.layoutserver.repository.LayoutRepository;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@RequiredArgsConstructor
@Service
public class LayoutService {

    private final LayoutRepository layoutRepository;

    public Layout getLayout(UUID id) {
        return layoutRepository.findById(id).orElseThrow();
    }

    public List<Metadata> getMetadata() {
        List<Metadata> metadata = new ArrayList<>();
        layoutRepository.findAll().forEach(layout -> metadata.add(layout.getMetadata()));
        return metadata;
    }

    public UUID createLayout(Layout layout) {
        return layoutRepository.save(layout).getId();
    }

    public void updateLayout(UUID id, Layout updatedLayout) {
        Layout oldLayout = getLayout(id);
        oldLayout.setDefinition(updatedLayout.getDefinition());
        oldLayout.setMetadata(updatedLayout.getMetadata());

        layoutRepository.save(oldLayout);
    }

    public void deleteLayout(UUID id) {
        layoutRepository.deleteById(id);
    }
}
