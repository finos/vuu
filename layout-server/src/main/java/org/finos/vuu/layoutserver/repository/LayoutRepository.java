package org.finos.vuu.layoutserver.repository;

import org.finos.vuu.layoutserver.model.Layout;
import org.springframework.data.repository.CrudRepository;
import org.springframework.stereotype.Repository;

import java.util.UUID;

@Repository
public interface LayoutRepository extends CrudRepository<Layout, UUID> {

    Layout findLayoutByMetadataId(UUID id);
}
