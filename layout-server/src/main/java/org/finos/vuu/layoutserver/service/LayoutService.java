package org.finos.vuu.layoutserver.service;

import java.util.Date;
import java.util.UUID;
import java.util.List;
import java.util.NoSuchElementException;
import lombok.RequiredArgsConstructor;
import org.finos.vuu.layoutserver.model.Layout;
import org.finos.vuu.layoutserver.model.Metadata;
import org.finos.vuu.layoutserver.repository.LayoutRepository;
import org.springframework.stereotype.Service;

@RequiredArgsConstructor
@Service
public class LayoutService {

    private final LayoutRepository layoutRepository;
    private final MetadataService metadataService;

    public Layout getLayout(UUID id) {
        return layoutRepository.findById(id)
            .orElseThrow(() -> new NoSuchElementException("Layout with ID '" + id + "' not found"));
    }

    public List<Metadata> getMetadata() {
        return metadataService.getMetadata();
    }

    public Layout createLayout(Layout layout) {
        UUID id = UUID.randomUUID();

        layout.setId(id);

        return layoutRepository.save(layout);
    }

    public void updateLayout(UUID layoutId, Layout newLayout) {
        Layout layoutToUpdate = getLayout(layoutId);
        Metadata newMetadata = newLayout.getMetadata();

        Metadata updatedMetadata = Metadata.builder()
            .baseMetadata(newMetadata.getBaseMetadata())
            .updated(new Date())
            .id(layoutToUpdate.getMetadata().getId())
            .build();

        layoutToUpdate.setDefinition(newLayout.getDefinition());
        layoutToUpdate.setMetadata(updatedMetadata);

        layoutRepository.save(layoutToUpdate);
    }

    public void deleteLayout(UUID id) {
        try {
            layoutRepository.deleteById(id);
        } catch (Exception e) {
            throw new NoSuchElementException("Layout with ID '" + id + "' not found");
        }
    }
}
