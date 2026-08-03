import { Collapsible, CollapsiblePanel, CollapsibleTrigger, FlexItem, FlexLayout, Link, VerticalNavigation, VerticalNavigationItem, VerticalNavigationItemContent, VerticalNavigationItemExpansionIcon, VerticalNavigationItemLabel, VerticalNavigationItemTrigger, VerticalNavigationSubMenu } from "@salt-ds/core";
import { forwardRef, useState, type ComponentPropsWithoutRef, type ReactNode } from "react";
import type { RemoteModuleDescriptor } from "../../module-federation/mf-utils";

import './PortalNav.css';
import { Icon } from "@vuu-ui/vuu-ui-controls";

const classBase = 'vuuPortalNav';

type NavItem = {
    title: string;
    href: string;
    icon?: ReactNode;
    children?: NavItem[];
};

const MockedTrigger = forwardRef<
    HTMLAnchorElement,
    ComponentPropsWithoutRef<typeof Link>
>(function MockedTrigger(props, ref) {
    const { to, ...rest } = props;

    return (
        <VerticalNavigationItemTrigger
            render={<Link to={to} ref={ref} />}
            {...rest}
        />
    );
});


function NestedItem(props: { item: NavItem; icon?: boolean }) {
    const { item, icon } = props;

    // const location = useLocation();
    const [collapsed, setCollapsed] = useState(false);

    if (Array.isArray(item.children) && item.children.length > 0) {
        return (
            <VerticalNavigationItem
                active={location.pathname.startsWith(item.href) && collapsed}
            >
                <Collapsible onOpenChange={(_, expanded) => setCollapsed(!expanded)}>
                    <VerticalNavigationItemContent>
                        <CollapsibleTrigger>
                            <VerticalNavigationItemTrigger>
                                {icon ? item.icon : undefined}
                                <VerticalNavigationItemLabel>
                                    {item.title}
                                </VerticalNavigationItemLabel>
                                <VerticalNavigationItemExpansionIcon />
                            </VerticalNavigationItemTrigger>
                        </CollapsibleTrigger>
                    </VerticalNavigationItemContent>
                    <CollapsiblePanel>
                        <VerticalNavigationSubMenu>
                            {item.children.map((child) => (
                                <NestedItem key={child.title} item={child} icon={icon} />
                            ))}
                        </VerticalNavigationSubMenu>
                    </CollapsiblePanel>
                </Collapsible>
            </VerticalNavigationItem>
        );
    }

    return (
        <VerticalNavigationItem active={location.pathname === item.href}>
            <VerticalNavigationItemContent>
                <MockedTrigger to={item.href}>
                    {icon ? item.icon : undefined}
                    <VerticalNavigationItemLabel>
                        {item.title}
                    </VerticalNavigationItemLabel>
                </MockedTrigger>
            </VerticalNavigationItemContent>
        </VerticalNavigationItem>
    );
}


export interface PortalNavProps {
    remoteModules: RemoteModuleDescriptor[]
}


const navItems: NavItem[] = [
    {
        children: [
            {
                href: '/products/widgets',
                title: 'Widgets'
            },
            {
                href: '/products/gadgets',
                title: 'Gadgets'
            },
            {
                href: '/products/doodads',
                title: 'Doodads'
            }
        ],
        href: '/products',
        icon: <Icon aria-hidden name="filter" />,
        title: 'Products'

    },
    {

        children: [
            {
                href: '/about/story',
                title: 'Our Story'
            },
            {
                href: '/about/team',
                title: 'Our Team'
            },
            {
                href: '/about/press',
                title: 'Press'
            }
        ],
        href: '/about',
        icon: <Icon aria-hidden name="filter" />,
        title: 'About Us'

    }, {
        href: '/support',
        icon: <Icon aria-hidden name="filter" />,
        title: 'Support'

    },

    {
        href: '/contact',
        icon: <Icon aria-hidden name="filter" />,
        title: 'Contact'

    }
]


export const PortalNav = ({ remoteModules }: PortalNavProps) => {


    return (
        <FlexLayout className={classBase}>
            <FlexItem className={`${classBase}-nav`}>
                <VerticalNavigation>
                    {navItems.map((navItem, i) => (
                        <NestedItem
                            icon={!!navItem.icon}
                            item={navItem}
                            key={i}
                        />

                    ))}
                </VerticalNavigation>            </FlexItem>
            <FlexItem className={`${classBase}-close`} >
            </FlexItem>
        </FlexLayout >
    )
}


