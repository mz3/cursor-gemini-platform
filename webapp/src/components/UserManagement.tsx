import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { adminService, AdminUser, CreateUserData, UpdateUserData } from '../services/adminService';
import { Users, Plus, Edit, Trash2, Search, Filter, Shield, User, UserCheck, UserX, ArrowLeft } from 'lucide-react';

interface UserManagementProps {
  onBack?: () => void;
}

const UserManagement: React.FC<UserManagementProps> = ({ onBack }) => {
  const { user, hasRole } = useAuth();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterActive, setFilterActive] = useState<boolean | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingUser, setEditingUser] = useState<AdminUser | null>(null);
  const [roles, setRoles] = useState<any[]>([]);

  // Check if user has admin role
  if (!hasRole('admin')) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <Shield className="mx-auto h-12 w-12 text-red-400" />
          <h1 className="mt-2 text-xl font-semibold text-gray-900 dark:text-white">Access Denied</h1>
          <p className="mt-1 text-gray-600 dark:text-gray-400">
            You don't have permission to access user management.
          </p>
        </div>
      </div>
    );
  }

  useEffect(() => {
    loadUsers();
    loadRoles();
  }, []);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const usersData = await adminService.getAllUsers();
      setUsers(usersData);
      setError(null);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load users');
      console.error('Error loading users:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadRoles = async () => {
    try {
      const rolesData = await adminService.getAllRoles();
      setRoles(rolesData);
    } catch (err) {
      console.error('Error loading roles:', err);
    }
  };

  const handleCreateUser = async (userData: CreateUserData) => {
    try {
      setError(null);
      await adminService.createUser(userData);
      setSuccess('User created successfully!');
      setShowCreateModal(false);
      loadUsers();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create user');
      console.error('Error creating user:', err);
    }
  };

  const handleUpdateUser = async (id: string, userData: UpdateUserData) => {
    try {
      setError(null);
      await adminService.updateUser(id, userData);
      setSuccess('User updated successfully!');
      setEditingUser(null);
      loadUsers();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update user');
      console.error('Error updating user:', err);
    }
  };

  const handleDeleteUser = async (id: string) => {
    if (!window.confirm('Are you sure you want to deactivate this user?')) {
      return;
    }

    try {
      setError(null);
      await adminService.deleteUser(id);
      setSuccess('User deactivated successfully!');
      loadUsers();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to deactivate user');
      console.error('Error deleting user:', err);
    }
  };

  const clearMessages = () => {
    setError(null);
    setSuccess(null);
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch =
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.role.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterActive === null || user.isActive === filterActive;
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="px-4 py-6 sm:px-0">
          <div className="border-b border-gray-200 dark:border-gray-700 pb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                {onBack && (
                  <button
                    onClick={onBack}
                    className="mr-4 p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                  >
                    <ArrowLeft className="w-5 h-5" />
                  </button>
                )}
                <div>
                  <h1 className="text-3xl font-bold leading-tight text-gray-900 dark:text-white">
                    User Management
                  </h1>
                  <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                    Manage users, roles, and permissions for your platform.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowCreateModal(true)}
                className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700"
              >
                <Plus className="w-4 h-4 mr-2" />
                Create User
              </button>
            </div>
          </div>
        </div>

        {/* Messages */}
        {(error || success) && (
          <div className="px-4 sm:px-0 mb-6">
            {error && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md p-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <div className="h-5 w-5 text-red-400">⚠</div>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
                  </div>
                  <div className="ml-auto pl-3">
                    <button
                      onClick={clearMessages}
                      className="text-red-400 hover:text-red-600"
                    >
                      ×
                    </button>
                  </div>
                </div>
              </div>
            )}
            {success && (
              <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-md p-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <div className="h-5 w-5 text-green-400">✓</div>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-green-800 dark:text-green-200">{success}</p>
                  </div>
                  <div className="ml-auto pl-3">
                    <button
                      onClick={clearMessages}
                      className="text-green-400 hover:text-green-600"
                    >
                      ×
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Controls */}
        <div className="px-4 sm:px-0 mb-6">
          <div className="bg-white dark:bg-gray-800 shadow rounded-lg">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Users ({filteredUsers.length})
                </h2>
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Create User
                </button>
              </div>
            </div>

            <div className="p-6">
              <div className="flex space-x-4 mb-6">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <input
                      type="text"
                      placeholder="Search users..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 pr-4 py-2 w-full border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-gray-100"
                    />
                  </div>
                </div>
                <select
                  value={filterActive === null ? 'all' : filterActive.toString()}
                  onChange={(e) => setFilterActive(e.target.value === 'all' ? null : e.target.value === 'true')}
                  className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-gray-100"
                >
                  <option value="all">All Status</option>
                  <option value="true">Active</option>
                  <option value="false">Inactive</option>
                </select>
              </div>

              {loading ? (
                <div className="flex items-center justify-center p-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
              ) : filteredUsers.length === 0 ? (
                <div className="text-center py-8">
                  <Users className="mx-auto h-12 w-12 text-gray-400" />
                  <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">No users found</p>
                </div>
              ) : (
                <div className="overflow-hidden">
                  <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-gray-50 dark:bg-gray-900">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          User
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Role
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Created
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                      {filteredUsers.map((user) => (
                        <tr key={user.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="flex-shrink-0 h-10 w-10">
                                <div className="h-10 w-10 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center">
                                  <User className="h-6 w-6 text-gray-600 dark:text-gray-400" />
                                </div>
                              </div>
                              <div className="ml-4">
                                <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                                  {user.firstName} {user.lastName}
                                </div>
                                <div className="text-sm text-gray-500 dark:text-gray-400">
                                  {user.email}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200">
                              {user.role}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              user.isActive
                                ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                                : 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
                            }`}>
                              {user.isActive ? (
                                <>
                                  <UserCheck className="w-3 h-3 mr-1" />
                                  Active
                                </>
                              ) : (
                                <>
                                  <UserX className="w-3 h-3 mr-1" />
                                  Inactive
                                </>
                              )}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                            {new Date(user.createdAt).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <div className="flex items-center justify-end space-x-2">
                              <button
                                onClick={() => setEditingUser(user)}
                                className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300"
                              >
                                <Edit className="w-4 h-4" />
                              </button>
                              {user.isActive && (
                                <button
                                  onClick={() => handleDeleteUser(user.id)}
                                  className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Create User Modal */}
        {showCreateModal && (
          <CreateUserModal
            roles={roles}
            onSubmit={handleCreateUser}
            onCancel={() => setShowCreateModal(false)}
          />
        )}

        {/* Edit User Modal */}
        {editingUser && (
          <EditUserModal
            user={editingUser}
            roles={roles}
            onSubmit={(userData) => handleUpdateUser(editingUser.id, userData)}
            onCancel={() => setEditingUser(null)}
          />
        )}
      </div>
    </div>
  );
};

// Create User Modal Component
interface CreateUserModalProps {
  roles: any[];
  onSubmit: (userData: CreateUserData) => void;
  onCancel: () => void;
}

const CreateUserModal: React.FC<CreateUserModalProps> = ({ roles, onSubmit, onCancel }) => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    role: 'user',
    isActive: true
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white dark:bg-gray-800">
        <div className="mt-3">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Create New User</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Email</label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Password</label>
              <input
                type="password"
                required
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">First Name</label>
                <input
                  type="text"
                  required
                  value={formData.firstName}
                  onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Last Name</label>
                <input
                  type="text"
                  required
                  value={formData.lastName}
                  onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Role</label>
              <select
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              >
                {roles.map((role) => (
                  <option key={role.name} value={role.name}>
                    {role.displayName || role.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-center">
              <input
                type="checkbox"
                id="isActive"
                checked={formData.isActive}
                onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="isActive" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
                Active
              </label>
            </div>
            <div className="flex justify-end space-x-3 pt-4">
              <button
                type="button"
                onClick={onCancel}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-600"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700"
              >
                Create User
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

// Edit User Modal Component
interface EditUserModalProps {
  user: AdminUser;
  roles: any[];
  onSubmit: (userData: UpdateUserData) => void;
  onCancel: () => void;
}

const EditUserModal: React.FC<EditUserModalProps> = ({ user, roles, onSubmit, onCancel }) => {
  const [formData, setFormData] = useState({
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    role: user.role,
    isActive: user.isActive,
    password: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const updateData: UpdateUserData = { ...formData };
    if (!updateData.password) {
      delete updateData.password;
    }
    onSubmit(updateData);
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white dark:bg-gray-800">
        <div className="mt-3">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Edit User</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Email</label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Password (leave blank to keep current)</label>
              <input
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">First Name</label>
                <input
                  type="text"
                  required
                  value={formData.firstName}
                  onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Last Name</label>
                <input
                  type="text"
                  required
                  value={formData.lastName}
                  onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Role</label>
              <select
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              >
                {roles.map((role) => (
                  <option key={role.name} value={role.name}>
                    {role.displayName || role.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-center">
              <input
                type="checkbox"
                id="isActive"
                checked={formData.isActive}
                onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="isActive" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
                Active
              </label>
            </div>
            <div className="flex justify-end space-x-3 pt-4">
              <button
                type="button"
                onClick={onCancel}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-600"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700"
              >
                Update User
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default UserManagement;
