import { useState, useCallback, useEffect } from "react";
import {
  Button,
  Input,
  DialogProps,
  Dialog,
  FormField,
  FormFieldLabel,
} from "@salt-ds/core";
import "./UserAdmin.css";

interface User {
  id: string;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  enabled: boolean;
}

interface Role {
  id: string;
  name: string;
}

interface Group {
  id: string;
  name: string;
  path: string;
}

interface UserRole {
  userId: string;
  roleId: string;
}

interface UserGroup {
  userId: string;
  groupId: string;
}

interface GroupRole {
  groupId: string;
  roleId: string;
}

const UserAdmin = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [userRoles, setUserRoles] = useState<UserRole[]>([]);
  const [userGroups, setUserGroups] = useState<UserGroup[]>([]);
  const [groupRoles, setGroupRoles] = useState<GroupRole[]>([]);
  const [activeTab, setActiveTab] = useState<"users" | "roles" | "groups">(
    "users"
  );
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [showUserDialog, setShowUserDialog] = useState(false);
  const [showRoleDialog, setShowRoleDialog] = useState(false);
  const [showGroupDialog, setShowGroupDialog] = useState(false);
  const [formData, setFormData] = useState<Partial<User>>({});
  const [roleFormData, setRoleFormData] = useState<Partial<Role>>({});
  const [groupFormData, setGroupFormData] = useState<Partial<Group>>({});
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  const [selectedRoleForUser, setSelectedRoleForUser] = useState<string>("");
  const [selectedGroupForUser, setSelectedGroupForUser] = useState<string>("");
  const [selectedRoleForGroup, setSelectedRoleForGroup] = useState<string>("");
  const [selectedUserForGroup, setSelectedUserForGroup] = useState<string>("");

  // Mock Keycloak API calls
  const keycloakBaseUrl = process.env.REACT_APP_KEYCLOAK_URL || "http://localhost:8080";
  const realmName = process.env.REACT_APP_KEYCLOAK_REALM || "master";

  // Fetch users from Keycloak
  const fetchUsers = useCallback(async () => {
    try {
      // Mock implementation - replace with actual Keycloak API call
      // const response = await fetch(`${keycloakBaseUrl}/admin/realms/${realmName}/users`, {
      //   headers: { Authorization: `Bearer ${token}` }
      // });
      // const data = await response.json();
      // setUsers(data);
      console.log("Fetching users from Keycloak...");
    } catch (error) {
      console.error("Failed to fetch users:", error);
    }
  }, []);

  // Fetch roles from Keycloak
  const fetchRoles = useCallback(async () => {
    try {
      // Mock implementation
      console.log("Fetching roles from Keycloak...");
    } catch (error) {
      console.error("Failed to fetch roles:", error);
    }
  }, []);

  // Fetch groups from Keycloak
  const fetchGroups = useCallback(async () => {
    try {
      // Mock implementation
      console.log("Fetching groups from Keycloak...");
    } catch (error) {
      console.error("Failed to fetch groups:", error);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
    fetchRoles();
    fetchGroups();
  }, [fetchUsers, fetchRoles, fetchGroups]);

  // User management functions
  const handleCreateUser = useCallback(async () => {
    try {
      // Mock: POST to Keycloak API
      // await fetch(`${keycloakBaseUrl}/admin/realms/${realmName}/users`, {
      //   method: "POST",
      //   headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      //   body: JSON.stringify(formData)
      // });
      const newUser: User = {
        id: String(Math.random()),
        username: formData.username || "",
        email: formData.email || "",
        firstName: formData.firstName || "",
        lastName: formData.lastName || "",
        enabled: true,
      };
      setUsers([...users, newUser]);
      setShowUserDialog(false);
      setFormData({});
    } catch (error) {
      console.error("Failed to create user:", error);
    }
  }, [formData, users]);

  const handleUpdateUser = useCallback(async () => {
    if (!editingUser) return;
    try {
      // Mock: PUT to Keycloak API
      const updatedUsers = users.map((u) =>
        u.id === editingUser.id ? { ...editingUser, ...formData } : u
      );
      setUsers(updatedUsers);
      setShowUserDialog(false);
      setEditingUser(null);
      setFormData({});
    } catch (error) {
      console.error("Failed to update user:", error);
    }
  }, [editingUser, formData, users]);

  const handleDeleteUser = useCallback(async (userId: string) => {
    try {
      // Mock: DELETE to Keycloak API
      setUsers(users.filter((u) => u.id !== userId));
    } catch (error) {
      console.error("Failed to delete user:", error);
    }
  }, [users]);

  // Role management functions
  const handleCreateRole = useCallback(async () => {
    try {
      // Mock: POST to Keycloak API
      const newRole: Role = {
        id: String(Math.random()),
        name: roleFormData.name || "",
      };
      setRoles([...roles, newRole]);
      setShowRoleDialog(false);
      setRoleFormData({});
    } catch (error) {
      console.error("Failed to create role:", error);
    }
  }, [roleFormData, roles]);

  const handleDeleteRole = useCallback(
    async (roleId: string) => {
      try {
        // Check if role is associated with any users (directly or via group)
        const hasDirectAssociations = userRoles.some(
          (ur) => ur.roleId === roleId
        );
        const hasGroupAssociations = groupRoles.some(
          (gr) => gr.roleId === roleId
        );

        if (hasDirectAssociations || hasGroupAssociations) {
          alert(
            "Cannot delete role. Users are associated with this role either directly or via a group."
          );
          return;
        }

        // Mock: DELETE to Keycloak API
        setRoles(roles.filter((r) => r.id !== roleId));
      } catch (error) {
        console.error("Failed to delete role:", error);
      }
    },
    [userRoles, groupRoles, roles]
  );

  const handleAddUserRole = useCallback(async () => {
    if (!selectedUserId || !selectedRoleForUser) return;
    try {
      // Mock: POST to Keycloak API
      const newUserRole: UserRole = {
        userId: selectedUserId,
        roleId: selectedRoleForUser,
      };
      setUserRoles([...userRoles, newUserRole]);
      setSelectedRoleForUser("");
    } catch (error) {
      console.error("Failed to add user role:", error);
    }
  }, [selectedUserId, selectedRoleForUser, userRoles]);

  const handleRemoveUserRole = useCallback(
    async (userId: string, roleId: string) => {
      try {
        // Mock: DELETE to Keycloak API
        setUserRoles(
          userRoles.filter(
            (ur) => !(ur.userId === userId && ur.roleId === roleId)
          )
        );
      } catch (error) {
        console.error("Failed to remove user role:", error);
      }
    },
    [userRoles]
  );

  // Group management functions
  const handleCreateGroup = useCallback(async () => {
    try {
      // Mock: POST to Keycloak API
      const newGroup: Group = {
        id: String(Math.random()),
        name: groupFormData.name || "",
        path: `/${groupFormData.name}`,
      };
      setGroups([...groups, newGroup]);
      setShowGroupDialog(false);
      setGroupFormData({});
    } catch (error) {
      console.error("Failed to create group:", error);
    }
  }, [groupFormData, groups]);

  const handleDeleteGroup = useCallback(
    async (groupId: string) => {
      try {
        // Check if group has any users associated
        const hasUsers = userGroups.some((ug) => ug.groupId === groupId);

        if (hasUsers) {
          alert("Cannot delete group. Users are associated with this group.");
          return;
        }

        // Mock: DELETE to Keycloak API
        setGroups(groups.filter((g) => g.id !== groupId));
        // Also clean up any group roles
        setGroupRoles(groupRoles.filter((gr) => gr.groupId !== groupId));
      } catch (error) {
        console.error("Failed to delete group:", error);
      }
    },
    [userGroups, groups, groupRoles]
  );

  const handleAddUserGroup = useCallback(async () => {
    if (!selectedUserId || !selectedGroupForUser) return;
    try {
      // Mock: POST to Keycloak API
      const newUserGroup: UserGroup = {
        userId: selectedUserId,
        groupId: selectedGroupForUser,
      };
      setUserGroups([...userGroups, newUserGroup]);
      setSelectedGroupForUser("");
    } catch (error) {
      console.error("Failed to add user group:", error);
    }
  }, [selectedUserId, selectedGroupForUser, userGroups]);

  const handleRemoveUserGroup = useCallback(
    async (userId: string, groupId: string) => {
      try {
        // Mock: DELETE to Keycloak API
        setUserGroups(
          userGroups.filter(
            (ug) => !(ug.userId === userId && ug.groupId === groupId)
          )
        );
      } catch (error) {
        console.error("Failed to remove user group:", error);
      }
    },
    [userGroups]
  );

  const handleRemoveAllUsersFromGroup = useCallback(
    async (groupId: string) => {
      try {
        const usersInGroup = userGroups.filter((ug) => ug.groupId === groupId);
        if (usersInGroup.length === 0) {
          alert("No users in this group");
          return;
        }

        if (
          !window.confirm(
            `Are you sure you want to remove all ${usersInGroup.length} user(s) from this group?`
          )
        ) {
          return;
        }

        // Mock: DELETE to Keycloak API
        setUserGroups(userGroups.filter((ug) => ug.groupId !== groupId));
      } catch (error) {
        console.error("Failed to remove users from group:", error);
      }
    },
    [userGroups]
  );

  const handleAddGroupRole = useCallback(async () => {
    if (!selectedGroupId || !selectedRoleForGroup) return;
    try {
      // Check if role already added to group
      const exists = groupRoles.some(
        (gr) => gr.groupId === selectedGroupId && gr.roleId === selectedRoleForGroup
      );

      if (exists) {
        alert("This role is already assigned to the group");
        return;
      }

      // Mock: POST to Keycloak API
      const newGroupRole: GroupRole = {
        groupId: selectedGroupId,
        roleId: selectedRoleForGroup,
      };
      setGroupRoles([...groupRoles, newGroupRole]);
      setSelectedRoleForGroup("");
    } catch (error) {
      console.error("Failed to add group role:", error);
    }
  }, [selectedGroupId, selectedRoleForGroup, groupRoles]);

  const handleRemoveGroupRole = useCallback(
    async (groupId: string, roleId: string) => {
      try {
        // Mock: DELETE to Keycloak API
        setGroupRoles(
          groupRoles.filter(
            (gr) => !(gr.groupId === groupId && gr.roleId === roleId)
          )
        );
      } catch (error) {
        console.error("Failed to remove group role:", error);
      }
    },
    [groupRoles]
  );

  const handleAddUserToGroup = useCallback(async () => {
    if (!selectedGroupId || !selectedUserForGroup) return;
    try {
      // Check if user already in group
      const exists = userGroups.some(
        (ug) =>
          ug.groupId === selectedGroupId && ug.userId === selectedUserForGroup
      );

      if (exists) {
        alert("This user is already in the group");
        return;
      }

      // Mock: POST to Keycloak API
      const newUserGroup: UserGroup = {
        userId: selectedUserForGroup,
        groupId: selectedGroupId,
      };
      setUserGroups([...userGroups, newUserGroup]);
      setSelectedUserForGroup("");
    } catch (error) {
      console.error("Failed to add user to group:", error);
    }
  }, [selectedGroupId, selectedUserForGroup, userGroups]);

  const openEditUserDialog = (user: User) => {
    setEditingUser(user);
    setFormData(user);
    setShowUserDialog(true);
  };

  const openNewUserDialog = () => {
    setEditingUser(null);
    setFormData({});
    setShowUserDialog(true);
  };

  return (
    <div className="vuuUserAdmin">
      <header className="vuuUserAdmin-header">
        <h1>User Admin</h1>
        <p>Manage users, roles, and groups in Keycloak</p>
      </header>

      <div className="vuuUserAdmin-tabs">
        <button
          className={`tab ${activeTab === "users" ? "active" : ""}`}
          onClick={() => setActiveTab("users")}
        >
          Users
        </button>
        <button
          className={`tab ${activeTab === "roles" ? "active" : ""}`}
          onClick={() => setActiveTab("roles")}
        >
          Roles
        </button>
        <button
          className={`tab ${activeTab === "groups" ? "active" : ""}`}
          onClick={() => setActiveTab("groups")}
        >
          Groups
        </button>
      </div>

      <div className="vuuUserAdmin-content">
        {/* Users Tab */}
        {activeTab === "users" && (
          <div className="vuuUserAdmin-section">
            <div className="section-header">
              <h2>Users</h2>
              <Button onClick={openNewUserDialog}>Create New User</Button>
            </div>

            <div className="users-list">
              {users.length === 0 ? (
                <p>No users found</p>
              ) : (
                <table className="users-table">
                  <thead>
                    <tr>
                      <th>Username</th>
                      <th>Email</th>
                      <th>First Name</th>
                      <th>Last Name</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((user) => (
                      <tr key={user.id}>
                        <td>{user.username}</td>
                        <td>{user.email}</td>
                        <td>{user.firstName}</td>
                        <td>{user.lastName}</td>
                        <td>{user.enabled ? "Enabled" : "Disabled"}</td>
                        <td>
                          <Button
                            onClick={() => setSelectedUserId(user.id)}
                            variant="secondary"
                            size="small"
                          >
                            Manage
                          </Button>
                          <Button
                            onClick={() => openEditUserDialog(user)}
                            variant="secondary"
                            size="small"
                          >
                            Edit
                          </Button>
                          <Button
                            onClick={() => handleDeleteUser(user.id)}
                            variant="secondary"
                            size="small"
                          >
                            Delete
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            {selectedUserId && (
              <div className="user-details-section">
                <h3>Manage Roles and Groups for User</h3>
                <p>
                  Selected User ID: {users.find((u) => u.id === selectedUserId)?.username}
                </p>

                <div className="role-management">
                  <h4>Roles</h4>
                  <div className="role-input">
                    <select
                      value={selectedRoleForUser}
                      onChange={(e) => setSelectedRoleForUser(e.target.value)}
                    >
                      <option value="">Select a role</option>
                      {roles.map((role) => (
                        <option key={role.id} value={role.id}>
                          {role.name}
                        </option>
                      ))}
                    </select>
                    <Button onClick={handleAddUserRole}>Add Role</Button>
                  </div>

                  <div className="user-roles-list">
                    {userRoles
                      .filter((ur) => ur.userId === selectedUserId)
                      .map((userRole) => {
                        const role = roles.find((r) => r.id === userRole.roleId);
                        return (
                          <div key={userRole.roleId} className="role-item">
                            <span>{role?.name}</span>
                            <Button
                              onClick={() =>
                                handleRemoveUserRole(
                                  userRole.userId,
                                  userRole.roleId
                                )
                              }
                              size="small"
                              variant="secondary"
                            >
                              Remove
                            </Button>
                          </div>
                        );
                      })}
                  </div>
                </div>

                <div className="group-management">
                  <h4>Groups</h4>
                  <div className="group-input">
                    <select
                      value={selectedGroupForUser}
                      onChange={(e) => setSelectedGroupForUser(e.target.value)}
                    >
                      <option value="">Select a group</option>
                      {groups.map((group) => (
                        <option key={group.id} value={group.id}>
                          {group.name}
                        </option>
                      ))}
                    </select>
                    <Button onClick={handleAddUserGroup}>Add Group</Button>
                  </div>

                  <div className="user-groups-list">
                    {userGroups
                      .filter((ug) => ug.userId === selectedUserId)
                      .map((userGroup) => {
                        const group = groups.find(
                          (g) => g.id === userGroup.groupId
                        );
                        return (
                          <div key={userGroup.groupId} className="group-item">
                            <span>{group?.name}</span>
                            <Button
                              onClick={() =>
                                handleRemoveUserGroup(
                                  userGroup.userId,
                                  userGroup.groupId
                                )
                              }
                              size="small"
                              variant="secondary"
                            >
                              Remove
                            </Button>
                          </div>
                        );
                      })}
                  </div>
                </div>

                <div className="close-user-details">
                  <Button
                    onClick={() => setSelectedUserId(null)}
                    variant="secondary"
                  >
                    Close
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Roles Tab */}
        {activeTab === "roles" && (
          <div className="vuuUserAdmin-section">
            <div className="section-header">
              <h2>Roles</h2>
              <Button onClick={() => setShowRoleDialog(true)}>
                Create New Role
              </Button>
            </div>

            <div className="roles-list">
              {roles.length === 0 ? (
                <p>No roles found</p>
              ) : (
                <table className="roles-table">
                  <thead>
                    <tr>
                      <th>Role Name</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {roles.map((role) => (
                      <tr key={role.id}>
                        <td>{role.name}</td>
                        <td>
                          <Button
                            onClick={() => handleDeleteRole(role.id)}
                            variant="secondary"
                            size="small"
                          >
                            Delete
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}

        {/* Groups Tab */}
        {activeTab === "groups" && (
          <div className="vuuUserAdmin-section">
            <div className="section-header">
              <h2>Groups</h2>
              <Button onClick={() => setShowGroupDialog(true)}>
                Create New Group
              </Button>
            </div>

            <div className="groups-list">
              {groups.length === 0 ? (
                <p>No groups found</p>
              ) : (
                <table className="groups-table">
                  <thead>
                    <tr>
                      <th>Group Name</th>
                      <th>Path</th>
                      <th>Members</th>
                      <th>Roles</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {groups.map((group) => {
                      const memberCount = userGroups.filter(
                        (ug) => ug.groupId === group.id
                      ).length;
                      const roleCount = groupRoles.filter(
                        (gr) => gr.groupId === group.id
                      ).length;
                      return (
                        <tr key={group.id}>
                          <td>{group.name}</td>
                          <td>{group.path}</td>
                          <td>{memberCount}</td>
                          <td>{roleCount}</td>
                          <td>
                            <Button
                              onClick={() => setSelectedGroupId(group.id)}
                              variant="secondary"
                              size="small"
                            >
                              Manage
                            </Button>
                            <Button
                              onClick={() => handleDeleteGroup(group.id)}
                              variant="secondary"
                              size="small"
                            >
                              Delete
                            </Button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>

            {selectedGroupId && (
              <div className="group-details-section">
                <h3>
                  Manage Roles and Members for Group:{" "}
                  {groups.find((g) => g.id === selectedGroupId)?.name}
                </h3>

                <div className="group-roles-section">
                  <h4>Group Roles</h4>
                  <div className="role-input">
                    <select
                      value={selectedRoleForGroup}
                      onChange={(e) =>
                        setSelectedRoleForGroup(e.target.value)
                      }
                    >
                      <option value="">Select a role to add</option>
                      {roles.map((role) => (
                        <option key={role.id} value={role.id}>
                          {role.name}
                        </option>
                      ))}
                    </select>
                    <Button onClick={handleAddGroupRole}>Add Role</Button>
                  </div>

                  <div className="group-roles-list">
                    {groupRoles
                      .filter((gr) => gr.groupId === selectedGroupId)
                      .map((groupRole) => {
                        const role = roles.find((r) => r.id === groupRole.roleId);
                        return (
                          <div key={groupRole.roleId} className="role-item">
                            <span>{role?.name}</span>
                            <Button
                              onClick={() =>
                                handleRemoveGroupRole(
                                  groupRole.groupId,
                                  groupRole.roleId
                                )
                              }
                              size="small"
                              variant="secondary"
                            >
                              Remove
                            </Button>
                          </div>
                        );
                      })}
                  </div>
                </div>

                <div className="group-members-section">
                  <h4>Group Members</h4>
                  <div className="members-input">
                    <select
                      value={selectedUserForGroup}
                      onChange={(e) =>
                        setSelectedUserForGroup(e.target.value)
                      }
                    >
                      <option value="">Select a user to add</option>
                      {users.map((user) => (
                        <option key={user.id} value={user.id}>
                          {user.username} ({user.email})
                        </option>
                      ))}
                    </select>
                    <Button onClick={handleAddUserToGroup}>Add User</Button>
                  </div>

                  <div className="members-control">
                    <Button onClick={() => handleRemoveAllUsersFromGroup(selectedGroupId)}>
                      Remove All Members
                    </Button>
                  </div>

                  <div className="group-members-list">
                    {userGroups
                      .filter((ug) => ug.groupId === selectedGroupId)
                      .map((userGroup) => {
                        const user = users.find((u) => u.id === userGroup.userId);
                        return (
                          <div key={userGroup.userId} className="member-item">
                            <span>{user?.username} ({user?.email})</span>
                            <Button
                              onClick={() =>
                                handleRemoveUserGroup(
                                  userGroup.userId,
                                  userGroup.groupId
                                )
                              }
                              size="small"
                              variant="secondary"
                            >
                              Remove
                            </Button>
                          </div>
                        );
                      })}
                  </div>
                </div>

                <div className="close-group-details">
                  <Button
                    onClick={() => setSelectedGroupId(null)}
                    variant="secondary"
                  >
                    Close
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* User Dialog */}
      {showUserDialog && (
        <div className="dialog-overlay">
          <div className="dialog-box">
            <h3>{editingUser ? "Edit User" : "Create New User"}</h3>
            <FormField>
              <FormFieldLabel>Username</FormFieldLabel>
              <Input
                value={formData.username || ""}
                onChange={(e) =>
                  setFormData({ ...formData, username: e.target.value })
                }
                disabled={!!editingUser}
              />
            </FormField>
            <FormField>
              <FormFieldLabel>Email</FormFieldLabel>
              <Input
                type="email"
                value={formData.email || ""}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
              />
            </FormField>
            <FormField>
              <FormFieldLabel>First Name</FormFieldLabel>
              <Input
                value={formData.firstName || ""}
                onChange={(e) =>
                  setFormData({ ...formData, firstName: e.target.value })
                }
              />
            </FormField>
            <FormField>
              <FormFieldLabel>Last Name</FormFieldLabel>
              <Input
                value={formData.lastName || ""}
                onChange={(e) =>
                  setFormData({ ...formData, lastName: e.target.value })
                }
              />
            </FormField>
            <div className="dialog-actions">
              <Button
                onClick={editingUser ? handleUpdateUser : handleCreateUser}
              >
                {editingUser ? "Update" : "Create"}
              </Button>
              <Button
                onClick={() => {
                  setShowUserDialog(false);
                  setEditingUser(null);
                  setFormData({});
                }}
                variant="secondary"
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Role Dialog */}
      {showRoleDialog && (
        <div className="dialog-overlay">
          <div className="dialog-box">
            <h3>Create New Role</h3>
            <FormField>
              <FormFieldLabel>Role Name</FormFieldLabel>
              <Input
                value={roleFormData.name || ""}
                onChange={(e) =>
                  setRoleFormData({ ...roleFormData, name: e.target.value })
                }
              />
            </FormField>
            <div className="dialog-actions">
              <Button onClick={handleCreateRole}>Create</Button>
              <Button
                onClick={() => {
                  setShowRoleDialog(false);
                  setRoleFormData({});
                }}
                variant="secondary"
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Group Dialog */}
      {showGroupDialog && (
        <div className="dialog-overlay">
          <div className="dialog-box">
            <h3>Create New Group</h3>
            <FormField>
              <FormFieldLabel>Group Name</FormFieldLabel>
              <Input
                value={groupFormData.name || ""}
                onChange={(e) =>
                  setGroupFormData({ ...groupFormData, name: e.target.value })
                }
              />
            </FormField>
            <div className="dialog-actions">
              <Button onClick={handleCreateGroup}>Create</Button>
              <Button
                onClick={() => {
                  setShowGroupDialog(false);
                  setGroupFormData({});
                }}
                variant="secondary"
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserAdmin;
