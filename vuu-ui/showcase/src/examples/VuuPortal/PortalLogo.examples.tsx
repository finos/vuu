import { PortalLogo } from "@vuu-ui/core/portal";
import { VuuLogo } from "@vuu-ui/vuu-icons";
import { MemoryRouter } from "react-router-dom";

export const VuuPortalLogo = () => (
  <MemoryRouter initialEntries={["/trading/orders"]}>
    <div style={{ height: 64, width: 56 }}>
      <PortalLogo alt="Portal home">
        <VuuLogo />
      </PortalLogo>
    </div>
  </MemoryRouter>
);
