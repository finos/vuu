package org.finos.vuu.layoutserver.service;

import lombok.RequiredArgsConstructor;
import org.finos.vuu.layoutserver.model.Layout;
import org.finos.vuu.layoutserver.model.Metadata;
import org.finos.vuu.layoutserver.repository.LayoutRepository;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.NoSuchElementException;
import java.util.UUID;

@RequiredArgsConstructor
@Service
public class LayoutService {

    private final LayoutRepository layoutRepository;

    public Layout getLayout(UUID id) {
        return layoutRepository.findById(id)
                .orElseThrow(() -> new NoSuchElementException("Layout with ID '" + id + "' not found"));
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
                .updated(LocalDate.now())
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
