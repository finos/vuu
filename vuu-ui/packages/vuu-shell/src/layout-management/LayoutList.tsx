
import { List } from '@finos/vuu-ui-controls';
import './LayoutList.css'

export type LayoutMetadata = {
    name: string,
    group: string,
    screenshot: string,
    user: string,
    date: string
}

export const LayoutsList = (props: { layouts: LayoutMetadata[] }) => {

    const { layouts } = props;

    const layoutsByGroup = layouts.reduce((acc: { [groupName: string]: LayoutMetadata[] }, cur) => acc[cur.group] ? { ...acc, [cur.group]: [...acc[cur.group], cur] } : { ...acc, [cur.group]: [cur] }, {})

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
                        ListItem={({ item }) =>
                            <div
                                className="vuuLayoutList-layoutContainer"
                                key={`${item?.group} ${item?.name}`}
                            >
                                <img className="vuuLayoutList-screenshot" src={item?.screenshot} />
                                <div>
                                    <div className="vuuLayoutList-layoutName">{item?.name}</div>
                                    <div className="vuuLayoutList-layoutDetails">
                                        <div>{`${item?.user}, ${item?.date}`}</div>
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

