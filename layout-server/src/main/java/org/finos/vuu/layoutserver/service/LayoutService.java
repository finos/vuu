package org.finos.vuu.layoutserver.service;

import java.util.Date;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.finos.vuu.layoutserver.model.Layout;
import org.finos.vuu.layoutserver.model.Metadata;
import org.finos.vuu.layoutserver.repository.LayoutRepository;
import org.springframework.stereotype.Service;

@RequiredArgsConstructor
@Service
public class LayoutService {

    private final LayoutRepository layoutRepository;

    public Layout getLayout(UUID id) {
        return layoutRepository.findById(id).orElseThrow();
    }

    public Layout getLayoutByMetadataId(UUID id) {
        return layoutRepository.findLayoutByMetadataId(id);
    }

    public UUID createLayout(Layout layout) {
        return layoutRepository.save(layout).getId();
    }

    public void updateLayout(UUID layoutId, Layout newLayout) {
        Layout layoutToUpdate = getLayout(layoutId);
        Metadata newMetadata = newLayout.getMetadata();

        Metadata updatedMetadata = Metadata.builder()
            .baseMetadata(newMetadata.getBaseMetadata())
            .updated(new Date())
            .build();

        layoutToUpdate.setDefinition(newLayout.getDefinition());
        layoutToUpdate.setMetadata(updatedMetadata);

        layoutRepository.save(layoutToUpdate);
    }

    public void deleteLayout(UUID id) {
        layoutRepository.deleteById(id);
    }
}
