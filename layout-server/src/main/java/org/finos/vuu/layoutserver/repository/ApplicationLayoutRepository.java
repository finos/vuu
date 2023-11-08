package org.finos.vuu.layoutserver.repository;

import org.finos.vuu.layoutserver.model.ApplicationLayout;
import org.springframework.data.repository.CrudRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ApplicationLayoutRepository extends CrudRepository<ApplicationLayout, String> {
}
