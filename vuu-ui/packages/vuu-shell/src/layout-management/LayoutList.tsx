import { HTMLAttributes } from 'react';
import { List } from '@finos/vuu-ui-controls';
import { LayoutMetadata } from './layoutTypes';
import { useLayoutManager } from './useLayoutManager';

import './LayoutList.css'

type LayoutGroups = {
    [groupName: string]: LayoutMetadata[]
}

const classBase = "vuuLayoutList";

export const LayoutsList = (props: HTMLAttributes<HTMLDivElement>) => {
    const { layoutMetadata, loadLayoutById } = useLayoutManager();

    const handleLoadLayout = (layoutId?: string) => {
        if (layoutId) {
            loadLayoutById(layoutId)
        }
    }

    const layoutsByGroup = layoutMetadata.reduce((acc: LayoutGroups, cur) => {
        if (acc[cur.group]) {
            return {
                ...acc,
                [cur.group]: [...acc[cur.group], cur]
            }
        }
        return {
            ...acc,
            [cur.group]: [cur]
        }
    }, {})

    return (
        <div className={classBase} {...props}>
            <div className={`${classBase}-header`}>My Layouts</div>
            <List<[string, LayoutMetadata[]]>
                height='fit-content'
                source={Object.entries(layoutsByGroup)}
                ListItem={({ item }) => {
                    if (!item) return <></>
                    const [groupName, layouts] = item
                    return <>
                        <div className={`${classBase}-groupName`}>{groupName}</div>
                        {layouts.map(layout =>
                            <div
                                className={`${classBase}-layoutContainer`}
                                key={layout?.id}
                                onClick={() => handleLoadLayout(layout?.id)}
                            >
                                <img className={`${classBase}-screenshot`} src={layout?.screenshot} />
                                <div>
                                    <div className={`${classBase}-layoutName`}>{layout?.name}</div>
                                    <div className={`${classBase}-layoutDetails`}>
                                        <div>{`${layout?.user}, ${layout?.date}`}</div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </>
                }
                }
            />
        </div>
    );
};

