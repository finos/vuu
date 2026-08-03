import { FlexLayout, FlexItem, SaltProviderNext, type Accent } from "@salt-ds/core";

import './PortalShell.css';
import { PortalHeader } from "../portal-header/PortalHeader";
import { PortalNav } from "../portal-nav/PortalNav";
import { RemoteModuleDescriptor } from "../../module-federation/mf-utils";

const classBase = 'vuuPortalShell';

const accentPurple = "purple" as Accent;

export interface PortalShellProps {
    remoteModules: RemoteModuleDescriptor[]
}

export const PortalShell = ({ remoteModules }: PortalShellProps) => {


    return (
        <SaltProviderNext accent={accentPurple} corner="rounded" density="high" mode="light" theme="vuu-theme">
            <FlexLayout className={classBase}>
                <FlexItem className={`${classBase}-navContainer`}>
                    <PortalNav remoteModules={remoteModules} />
                </FlexItem>
                <FlexItem className={`${classBase}-main`}>
                    <FlexLayout className={`${classBase}-main`} direction="column">
                        <FlexItem className={`${classBase}-header`}>
                            <PortalHeader />
                        </FlexItem>
                        <FlexItem className={`${classBase}-content`}>
                            <div className={`${classBase}-content`} />
                        </FlexItem>
                    </FlexLayout >
                </FlexItem>
            </FlexLayout >
        </SaltProviderNext>
    )
}