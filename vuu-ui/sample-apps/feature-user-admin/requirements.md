# User Admin UI - Complete Feature Specification

## Overview
A comprehensive user administration interface for managing users, roles, and groups in Keycloak. The application provides a tabbed interface for managing these entities and their relationships.

## Technology Stack
- React 19.2.3 with TypeScript
- Salt DS Core (1.54.1) for UI components
- CSS for styling with responsive design
- Module Federation (port 5007)
- Vuu Shell integration

## Architecture
- Single-page application with three main tabs: Users, Roles, Groups
- React hooks for state management (useState, useCallback, useEffect)
- Mock Keycloak integration ready for REST API calls
- Environment variables for Keycloak configuration:
  - `REACT_APP_KEYCLOAK_URL` (default: http://localhost:8080)
  - `REACT_APP_KEYCLOAK_REALM` (default: master)

## User Management

### List Users
- Display table of all users with columns: Username, Email, First Name, Last Name, Status (Enabled/Disabled)
- Show action buttons: Manage, Edit, Delete

### Create User
- Dialog form with fields:
  - Username (required, unique)
  - Email (required, email format)
  - First Name
  - Last Name
- New users default to enabled status
- Create button opens new user dialog

### Edit User
- Click "Edit" button on user row
- Allows modification of: Email, First Name, Last Name
- Username is disabled (cannot be changed)
- Update dialog with Save/Cancel actions

### Delete User
- Click "Delete" button on user row
- Removes user and associated user-role and user-group relationships
- No constraints on deletion

### Manage User Roles and Groups
- Click "Manage" button on user row to expand details panel
- Panel shows selected username and two sections:

#### User Roles Section
- Dropdown to select available roles
- "Add Role" button to assign role to user
- List of assigned roles with individual "Remove" buttons
- Prevents duplicate role assignments

#### User Groups Section
- Dropdown to select available groups
- "Add Group" button to assign user to group
- List of assigned groups with individual "Remove" buttons
- Prevents duplicate group assignments

## Role Management

### List Roles
- Display table of all roles with columns: Role Name, Actions
- Show action buttons: Delete

### Create Role
- Button opens dialog form
- Field: Role Name (required, unique)
- Create/Cancel actions

### Delete Role with Constraints
- Role cannot be deleted if:
  - Any users are directly assigned to the role
  - Any groups have the role assigned
- Display alert if deletion not allowed: "Cannot delete role. Users are associated with this role either directly or via a group."
- DELETE request to: `DELETE /admin/realms/{realm}/roles/{roleId}`

## Group Management

### List Groups
- Display table of all groups with columns: Group Name, Path, Members (count), Roles (count), Actions
- Show action buttons: Manage, Delete

### Create Group
- Button opens dialog form
- Field: Group Name (required, unique)
- Path auto-generated as: `/{groupName}`
- Create/Cancel actions

### Delete Group with Constraints
- Group cannot be deleted if:
  - Any users are associated with the group
- Display alert if deletion not allowed: "Cannot delete group. Users are associated with this group."
- Auto-cleanup: Remove all group-role associations when group is deleted
- DELETE request to: `DELETE /admin/realms/{realm}/groups/{groupId}`

### Manage Group Roles and Members
- Click "Manage" button on group row to expand details panel
- Panel shows selected group name and two sections:

#### Group Roles Section
- Dropdown to select available roles
- "Add Role" button to assign role to group
- List of assigned roles with individual "Remove" buttons
- Prevents duplicate role-group assignments
- Inheriting users get these roles automatically

#### Group Members Section
- Dropdown to select available users
- "Add User" button to add user to group
- "Remove All Members" button to remove all users from group (with confirmation)
- List of group members with individual "Remove" buttons
- Shows username and email for each member
- Prevents duplicate user-group assignments

## Data Models

### User
```typescript
interface User {
  id: string;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  enabled: boolean;
}
```

### Role
```typescript
interface Role {
  id: string;
  name: string;
}
```

### Group
```typescript
interface Group {
  id: string;
  name: string;
  path: string;
}
```

### UserRole (Association)
```typescript
interface UserRole {
  userId: string;
  roleId: string;
}
```

### UserGroup (Association)
```typescript
interface UserGroup {
  userId: string;
  groupId: string;
}
```

### GroupRole (Association)
```typescript
interface GroupRole {
  groupId: string;
  roleId: string;
}
```

## UI Components and Layout

### Header
- Title: "User Admin"
- Description: "Manage users, roles, and groups in Keycloak"
- Gradient background (purple)

### Navigation Tabs
- Three tabs: Users, Roles, Groups
- Active tab highlighted with color change and bottom border
- Smooth transitions between tabs

### Users Tab
- Section header with "Create New User" button
- Users table with Manage, Edit, Delete actions
- Expandable user details section (visible when user is selected)
  - Role management: dropdown + add button
  - Group management: dropdown + add button
  - Close button to collapse section

### Roles Tab
- Section header with "Create New Role" button
- Roles table with Delete action

### Groups Tab
- Section header with "Create New Group" button
- Groups table with Manage and Delete actions
- Expandable group details section (visible when group is selected)
  - Group roles: dropdown + add button, list of roles with remove buttons
  - Group members: dropdown + add button, "Remove All Members" button, list of members with remove buttons
  - Close button to collapse section

### Dialogs
- User Dialog: Create/Edit with username, email, first name, last name fields
- Role Dialog: Create with role name field
- Group Dialog: Create with group name field
- All dialogs have Create/Update and Cancel buttons

## Validation and Error Handling

### Input Validation
- Username: Required, must be unique
- Email: Required, must be valid email format
- Role Name: Required, must be unique
- Group Name: Required, must be unique

### Constraint Validation
- Prevent duplicate user-role assignments: Show alert "This role is already assigned to the user"
- Prevent duplicate user-group assignments: Show alert "This user is already in the group"
- Prevent duplicate group-role assignments: Show alert "This role is already assigned to the group"

### Deletion Constraints
- Role deletion: Check if any users or groups use the role
- Group deletion: Check if group has any members

### User Confirmations
- Remove all members from group: Confirmation dialog showing member count

## Styling

### Color Scheme
- Primary: #667eea (blue-purple)
- Secondary: #764ba2 (purple)
- Background: #f5f5f5 (light gray)
- Text: #333 (dark gray)
- Borders: #e0e0e0 (light gray)

### Responsive Design
- Mobile breakpoint: 768px
- Tables adapt to smaller screens
- Dialogs resize appropriately
- Buttons stack vertically on mobile

### Component Styling
- Tables: Striped rows, hover effects
- Buttons: Primary (blue), Secondary (gray), Danger (red/orange)
- Forms: Input fields with focus states
- Lists: Card-like items with remove buttons
- Dialogs: Centered overlay with shadow

## Keycloak Integration

### REST API Endpoints (To be implemented)
- List Users: `GET /admin/realms/{realm}/users`
- Create User: `POST /admin/realms/{realm}/users`
- Update User: `PUT /admin/realms/{realm}/users/{userId}`
- Delete User: `DELETE /admin/realms/{realm}/users/{userId}`
- List Roles: `GET /admin/realms/{realm}/roles`
- Create Role: `POST /admin/realms/{realm}/roles`
- Delete Role: `DELETE /admin/realms/{realm}/roles/{roleId}`
- List Groups: `GET /admin/realms/{realm}/groups`
- Create Group: `POST /admin/realms/{realm}/groups`
- Delete Group: `DELETE /admin/realms/{realm}/groups/{groupId}`
- Add User Role: `POST /admin/realms/{realm}/users/{userId}/role-mappings/realm`
- Remove User Role: `DELETE /admin/realms/{realm}/users/{userId}/role-mappings/realm`
- Add User Group: `PUT /admin/realms/{realm}/users/{userId}/groups/{groupId}`
- Remove User Group: `DELETE /admin/realms/{realm}/users/{userId}/groups/{groupId}`
- Add Group Role: `POST /admin/realms/{realm}/groups/{groupId}/role-mappings/realm`
- Remove Group Role: `DELETE /admin/realms/{realm}/groups/{groupId}/role-mappings/realm`

All API calls should include Bearer token authentication: `Authorization: Bearer {token}`

## Module Federation Configuration
- Module Name: userAdmin
- Port: 5007
- Exposed Component: ./UserAdmin
- Import Path: userAdmin/UserAdmin
- Peer Dependencies: react, react-dom, clsx
- Dependencies: @vuu-ui/vuu-shell, @vuu-ui/vuu-utils2, @salt-ds/core

## File Structure
```
feature-user-admin/
├── package.json
├── public/
│   ├── index.html
│   └── vuu-icon.svg
└── src/
    ├── index.tsx
    ├── bootstrap.tsx
    ├── UserAdmin.tsx (Main component)
    └── UserAdmin.css
```