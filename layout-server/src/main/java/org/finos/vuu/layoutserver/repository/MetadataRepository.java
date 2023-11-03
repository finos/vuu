package org.finos.vuu.layoutserver.repository;

import java.util.UUID;
import org.finos.vuu.layoutserver.model.Metadata;
import org.springframework.data.repository.CrudRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface MetadataRepository extends CrudRepository<Metadata, UUID> {}
