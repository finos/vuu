package org.finos.vuu.layoutserver.service;

import java.util.Date;
import java.util.List;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.finos.vuu.layoutserver.model.Layout;
import org.finos.vuu.layoutserver.model.Metadata;
import org.finos.vuu.layoutserver.repository.LayoutRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@RequiredArgsConstructor
@Service
public class LayoutService {

    private final LayoutRepository layoutRepository;
    private final MetadataService metadataService;

    public Layout getLayout(UUID id) {
        return layoutRepository.findById(id).orElseThrow();
    }

    public List<Metadata> getMetadata() {
        return metadataService.getMetadata();
    }

    @Transactional
    public UUID createLayout(Layout layout) {
        Metadata metadata = metadataService.createMetadata(layout.getMetadata());
        metadata.setLayout(layout);
        layout.setMetadata(metadata);
        return layoutRepository.save(layout).getId();
    }

    public void updateLayout(UUID layoutId, Layout newLayout) {
        Layout layoutToUpdate = getLayout(layoutId);
        layoutToUpdate.setDefinition(newLayout.getDefinition());

        Metadata metadataToUpdate = layoutToUpdate.getMetadata();
        metadataToUpdate.setName(newLayout.getMetadata().getName());
        metadataToUpdate.setGroup(newLayout.getMetadata().getGroup());
        metadataToUpdate.setScreenshot(newLayout.getMetadata().getScreenshot());
        metadataToUpdate.setUser(newLayout.getMetadata().getUser());
        metadataToUpdate.setUpdated(new Date());

        layoutRepository.save(layoutToUpdate);
    }

    public void deleteLayout(UUID id) {
        layoutRepository.deleteById(id);
    }
}
