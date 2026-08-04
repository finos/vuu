import type { ColumnDescriptor } from "@vuu-ui/vuu-table-types";

export const moduleColumnDescriptors: ColumnDescriptor[] = [
    { name: 'name', label: 'Component Name', width: 150, heading: ['Remote Module Details'] },
    { name: 'title', label: 'Title', width: 200, heading: ['Remote Module Details'] },
    { name: 'description', label: 'Description', width: 200, heading: ['Remote Module Details'] },
    { name: 'version', label: 'Version', width: 100, heading: ['Remote Module Details'] },
    { name: 'enabled', label: 'Enabled', heading: ['Remote Module Details'] },
    { name: 'location', label: 'Location', width: 200, heading: ['UI Menu Details'] },
    { name: 'path', label: 'Path', width: 150, heading: ['UI Menu Details'] },
    { name: 'mfComponent', label: 'Component Name', width: 200, heading: ['Module Federation Details'] },
    { name: 'mfScope', label: 'Scope', width: 150, heading: ['Module Federation Details'] },
    { name: 'mfUrl', label: 'Manifest Url', width: 200, heading: ['Module Federation Details'] },
    { name: 'vuuConnectionId', label: 'Connection ID', width: 120, heading: ['Vuu Connection Details'] },
    { name: 'vuuWebsocketUrl', label: 'WebSocket Url', width: 200, heading: ['Vuu Connection Details'] },
    { name: 'vuuRestUrl', label: 'Rest Url', width: 200, heading: ['Vuu Connection Details'] }
]

export const editableColumns = ['enabled', 'location', 'path']