1. client logs in for first time
   /api/vui/{username}

1A) existing service responds with 404, so we display defaultLayout, with placeholder

**defaultLayout JSON is hardcoded in the app**

```JSON
{

type: "Stack",
props: {
    style: {
        width: "100%",
        height: "100%",
    },
    enableAddTab: true,
    enableRemoveTab: true,
    preserve: true,
    active: 0,
    TabstripProps: {
        allowAddTab: true,
        allowCloseTab: true,
        allowRenameTab: true,
    },
},
children: [
    {
        type: "Placeholder",
        title: "Page 1",
    },
]
}
```

1B) new service returns defaultLayout, with placeholder "vuu.layout.version": 2

Note: we wrap the layout structure with an enclosing envelope that carries the version. We might
eventually want to record additional metadata here or user settings etc. Maybe application id

Note also: the 'placeholder' is defined inline. I think the new system should equally support
inline layouts and dynamically loaded layouts. The former should be considered readonly

```JSON
{
"vuu.layout.version": 2
layout:
    {

    type: "Stack",
    props: {
        style: {
            width: "100%",
            height: "100%",
        },
        enableAddTab: true,
        enableRemoveTab: true,
        preserve: true,
        active: 0,
        TabstripProps: {
            allowAddTab: true,
            allowCloseTab: true,
            allowRenameTab: true,
        },
    },
    children: [
        {
            type: "Placeholder",
            title: "Page 1",
        },
    ]
    }
}
```

2. UI renders defaultLayout, with placeholder. In either of the scenarios above we reach this point.

3. User drags content onto layout to replace or displace placeholder

3A) existing service POSTS to /api/vui/{username} the full persisted JSON structure, as above but with new content in open tab

```JSON
{

type: "Stack",
props: {
    style: {
        width: "100%",
        height: "100%",
    },
    enableAddTab: true,
    enableRemoveTab: true,
    preserve: true,
    active: 0,
    TabstripProps: {
        allowAddTab: true,
        allowCloseTab: true,
        allowRenameTab: true,
    },
},
children: [
    {
        type: "View",
        id: 'xzy',
        title: "Page 1",
        props: {
            closeable: true,
            header: true,
            label: "SIMUL Instruments",
            resize: "defer"
        },
        state: {
            "table-config": {
                columns: [
                    {name: "ric", label: "RIC", pin: "left" },
                    ...
                ]
            }
        },
        children: [
            {
                type: "Feature",
                props: {
                    url: "./feature-vuu-table/index.js"
                    css: "./feature-vuu-table/index.css"
                }

            }
        ]
    },
]
}
```

3B) new service makes 2 POST requests

Save the application-level JSON ...

- /api/vui/{username}

```JSON
{
"vuu.layout.version": 2
layout:
    {

    type: "Stack",
    props: {
        style: {
            width: "100%",
            height: "100%",
        },
        enableAddTab: true,
        enableRemoveTab: true,
        preserve: true,
        active: 0,
        TabstripProps: {
            allowAddTab: true,
            allowCloseTab: true,
            allowRenameTab: true,
        },
    },
    children: [
        {
            type: "layout",
            title: "Page 1",
            url: "/api/vui/{username}/xyz"
        },
    ]
    }
}
```

save the new layout ...

- /api/vui/layouts/xyz

```JSON
{
    id: "xyz"
    createdBy: "",
    createdTime: "",
    lastUpdatedTime: "",
    layout: {
        type: "View",
        id: 'xzy',
        title: "Page 1",
        props: {
            closeable: true,
            header: true,
            label: "SIMUL Instruments",
            resize: "defer"
        },
        state: {
            "table-config": {
                columns: [
                    {name: "ric", label: "RIC", pin: "left" },
                    ...
                ]
            }
        },
        children: [
            {
                type: "Feature",
                props: {
                    url: "./feature-vuu-table/index.js"
                    css: "./feature-vuu-table/index.css"
                }

            }
        ]
    }
}

```
