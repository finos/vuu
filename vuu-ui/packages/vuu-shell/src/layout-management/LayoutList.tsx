import { List } from '@finos/vuu-ui-controls';
import { LayoutMetadata } from './layoutTypes';

import './LayoutList.css'

type LayoutGroups = {
    [groupName: string]: LayoutMetadata[]
}

export const LayoutsList = (props: { layouts: LayoutMetadata[] }) => {
    const { layouts } = props;

    const layoutsByGroup = layouts.reduce((acc: LayoutGroups, cur) => {
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
        <>
            <div className='vuuLayoutList-header'>My Layouts</div>
            <List<[string, LayoutMetadata[]]>
                height='fit-content'
                source={Object.entries(layoutsByGroup)}
                ListItem={({ item }) => <>
                    <div className="vuuLayoutList-groupName">{item?.[0]}</div>
                    <List<LayoutMetadata>
                        height='fit-content'
                        source={item?.[1]}
                        ListItem={({ item: layout }) =>
                            <div
                                className="vuuLayoutList-layoutContainer"
                                key={`${layout?.group} ${layout?.name}`}
                            >
                                <img className="vuuLayoutList-screenshot" src={layout?.screenshot} />
                                <div>
                                    <div className="vuuLayoutList-layoutName">{layout?.name}</div>
                                    <div className="vuuLayoutList-layoutDetails">
                                        <div>{`${layout?.user}, ${layout?.date}`}</div>
                                    </div>
                                </div>
                            </div>
                        }
                    />
                </>
                }
            />
        </>
    );
};

