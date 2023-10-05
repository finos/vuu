package org.finos.vuu.layoutserver.repository;

import java.util.UUID;
import org.finos.vuu.layoutserver.model.Layout;
import org.springframework.data.repository.CrudRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface LayoutRepository extends CrudRepository<Layout, UUID> {}
