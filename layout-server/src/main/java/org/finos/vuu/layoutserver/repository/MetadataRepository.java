package org.finos.vuu.layoutserver.repository;

import org.finos.vuu.layoutserver.model.Metadata;
import org.springframework.data.repository.CrudRepository;
import org.springframework.stereotype.Repository;

import java.util.UUID;

@Repository
public interface MetadataRepository extends CrudRepository<Metadata, UUID> {}
