# Skills Admin API - Frontend Integration Guide

## Table of Contents
1. [Create Skill Form](#1-create-skill-form)
2. [Skills List with Toggle Status](#2-skills-list-with-toggle-status)
3. [Skill Edit Form](#3-skill-edit-form)
4. [Bulk Operations](#4-bulk-operations)
5. [Analytics Dashboard](#5-analytics-dashboard)

---

## 1. Create Skill Form

### ✅ Correct Implementation (No isActive field)

```jsx
// components/admin/SkillCreateForm.jsx
import { useState } from 'react';

const SkillCreateForm = () => {
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    description: '',
    aliases: '',  // comma-separated string
    demandLevel: 'medium',
    trend: 'stable'
    // ✅ NO isActive field - backend handles it
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Convert aliases string to array
      const aliasesArray = formData.aliases
        .split(',')
        .map(alias => alias.trim())
        .filter(alias => alias.length > 0);

      const payload = {
        name: formData.name.trim(),
        category: formData.category,
        description: formData.description.trim(),
        aliases: aliasesArray,
        demandLevel: formData.demandLevel,
        trend: formData.trend
        // ✅ isActive NOT included - defaults to true
      };

      const response = await fetch('/api/admin/skills', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('admin_token')}`
        },
        body: JSON.stringify(payload)
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to create skill');
      }

      if (result.success) {
        alert('✅ Skill created successfully!');
        console.log('Created skill:', result.data.skill);
        // result.data.skill.isActive === true (auto-set by backend)
        
        // Reset form
        setFormData({
          name: '',
          category: '',
          description: '',
          aliases: '',
          demandLevel: 'medium',
          trend: 'stable'
        });
      }
    } catch (err) {
      setError(err.message);
      console.error('Error creating skill:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow">
      <h2 className="text-2xl font-bold mb-6">Create New Skill</h2>

      {error && (
        <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
        </div>
      )}

      {/* Name */}
      <div className="mb-4">
        <label className="block text-sm font-medium mb-2">
          Skill Name <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          value={formData.name}
          onChange={(e) => setFormData({...formData, name: e.target.value})}
          placeholder="e.g., React, Python, Docker"
          required
          className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Category */}
      <div className="mb-4">
        <label className="block text-sm font-medium mb-2">
          Category <span className="text-red-500">*</span>
        </label>
        <select
          value={formData.category}
          onChange={(e) => setFormData({...formData, category: e.target.value})}
          required
          className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Select Category</option>
          <option value="programming-languages">Programming Languages</option>
          <option value="frontend">Frontend Development</option>
          <option value="backend">Backend Development</option>
          <option value="databases">Databases</option>
          <option value="devops">DevOps & Cloud</option>
          <option value="mobile">Mobile Development</option>
          <option value="design">UI/UX Design</option>
          <option value="testing">Testing & QA</option>
          <option value="ai-ml">AI & Machine Learning</option>
        </select>
      </div>

      {/* Description */}
      <div className="mb-4">
        <label className="block text-sm font-medium mb-2">
          Description
        </label>
        <textarea
          value={formData.description}
          onChange={(e) => setFormData({...formData, description: e.target.value})}
          placeholder="Brief description of the skill..."
          rows="3"
          maxLength="500"
          className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <p className="text-xs text-gray-500 mt-1">
          {formData.description.length}/500 characters
        </p>
      </div>

      {/* Aliases */}
      <div className="mb-4">
        <label className="block text-sm font-medium mb-2">
          Aliases (comma-separated)
        </label>
        <input
          type="text"
          value={formData.aliases}
          onChange={(e) => setFormData({...formData, aliases: e.target.value})}
          placeholder="e.g., ReactJS, React.js"
          className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <p className="text-xs text-gray-500 mt-1">
          Alternative names for this skill
        </p>
      </div>

      {/* Demand Level */}
      <div className="mb-4">
        <label className="block text-sm font-medium mb-2">
          Demand Level
        </label>
        <select
          value={formData.demandLevel}
          onChange={(e) => setFormData({...formData, demandLevel: e.target.value})}
          className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="low">🟢 Low</option>
          <option value="medium">🟡 Medium</option>
          <option value="high">🟠 High</option>
          <option value="critical">🔴 Critical</option>
        </select>
      </div>

      {/* Trend */}
      <div className="mb-4">
        <label className="block text-sm font-medium mb-2">
          Market Trend
        </label>
        <select
          value={formData.trend}
          onChange={(e) => setFormData({...formData, trend: e.target.value})}
          className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="declining">📉 Declining</option>
          <option value="stable">➡️ Stable</option>
          <option value="growing">📈 Growing</option>
          <option value="emerging">🚀 Emerging</option>
        </select>
      </div>

      {/* ✅ NO isActive checkbox/toggle - skill is always created as active */}

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
      >
        {loading ? 'Creating...' : 'Create Skill'}
      </button>
    </form>
  );
};

export default SkillCreateForm;
```

---

## 2. Skills List with Toggle Status

```jsx
// components/admin/SkillsList.jsx
import { useState, useEffect } from 'react';

const SkillsList = () => {
  const [skills, setSkills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    page: 1,
    limit: 20,
    status: 'all',
    category: '',
    search: '',
    sortBy: 'name',
    sortOrder: 'asc'
  });
  const [pagination, setPagination] = useState(null);

  useEffect(() => {
    fetchSkills();
  }, [filters]);

  const fetchSkills = async () => {
    setLoading(true);
    try {
      const queryParams = new URLSearchParams();
      Object.keys(filters).forEach(key => {
        if (filters[key]) queryParams.append(key, filters[key]);
      });

      const response = await fetch(
        `/api/admin/skills?${queryParams.toString()}`,
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('admin_token')}`
          }
        }
      );

      const result = await response.json();
      if (result.success) {
        setSkills(result.data.skills);
        setPagination(result.data.pagination);
      }
    } catch (error) {
      console.error('Error fetching skills:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleSkillStatus = async (skillId, currentStatus) => {
    try {
      const response = await fetch(
        `/api/admin/skills/${skillId}/toggle-status`,
        {
          method: 'PATCH',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('admin_token')}`
          }
        }
      );

      const result = await response.json();
      if (result.success) {
        // Update local state
        setSkills(skills.map(skill =>
          skill._id === skillId
            ? { ...skill, isActive: result.data.skill.isActive }
            : skill
        ));
        
        alert(`✅ Skill ${result.data.skill.isActive ? 'activated' : 'deactivated'} successfully!`);
      }
    } catch (error) {
      console.error('Error toggling skill status:', error);
      alert('❌ Failed to toggle skill status');
    }
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Skills Management</h2>
        <button className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
          + Add New Skill
        </button>
      </div>

      {/* Filters */}
      <div className="mb-6 grid grid-cols-4 gap-4">
        <input
          type="text"
          placeholder="Search skills..."
          value={filters.search}
          onChange={(e) => setFilters({...filters, search: e.target.value, page: 1})}
          className="px-3 py-2 border rounded"
        />
        <select
          value={filters.status}
          onChange={(e) => setFilters({...filters, status: e.target.value, page: 1})}
          className="px-3 py-2 border rounded"
        >
          <option value="all">All Status</option>
          <option value="active">✅ Active</option>
          <option value="inactive">⛔ Inactive</option>
        </select>
        <select
          value={filters.category}
          onChange={(e) => setFilters({...filters, category: e.target.value, page: 1})}
          className="px-3 py-2 border rounded"
        >
          <option value="">All Categories</option>
          <option value="frontend">Frontend</option>
          <option value="backend">Backend</option>
          <option value="databases">Databases</option>
          {/* Add more categories */}
        </select>
        <select
          value={filters.sortBy}
          onChange={(e) => setFilters({...filters, sortBy: e.target.value})}
          className="px-3 py-2 border rounded"
        >
          <option value="name">Sort by Name</option>
          <option value="popularity">Sort by Popularity</option>
          <option value="createdAt">Sort by Date</option>
        </select>
      </div>

      {/* Skills Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full">
          <thead className="bg-gray-100">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Demand</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Trend</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Usage</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {loading ? (
              <tr>
                <td colSpan="7" className="px-6 py-4 text-center">Loading...</td>
              </tr>
            ) : skills.length === 0 ? (
              <tr>
                <td colSpan="7" className="px-6 py-4 text-center">No skills found</td>
              </tr>
            ) : (
              skills.map(skill => (
                <tr key={skill._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="font-medium">{skill.name}</div>
                    {skill.aliases && skill.aliases.length > 0 && (
                      <div className="text-xs text-gray-500">
                        Aliases: {skill.aliases.join(', ')}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 text-sm">{skill.category}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 text-xs rounded ${
                      skill.demandLevel === 'critical' ? 'bg-red-100 text-red-800' :
                      skill.demandLevel === 'high' ? 'bg-orange-100 text-orange-800' :
                      skill.demandLevel === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-green-100 text-green-800'
                    }`}>
                      {skill.demandLevel}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm">
                      {skill.trend === 'emerging' ? '🚀' :
                       skill.trend === 'growing' ? '📈' :
                       skill.trend === 'stable' ? '➡️' : '📉'}
                      {' '}{skill.trend}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 text-xs rounded ${
                      skill.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                    }`}>
                      {skill.isActive ? '✅ Active' : '⛔ Inactive'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm">
                    {skill.usage && (
                      <div className="text-xs">
                        <div>Jobs: {skill.usage.jobCount}</div>
                        <div>Candidates: {skill.usage.candidateCount}</div>
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex gap-2">
                      <button
                        onClick={() => toggleSkillStatus(skill._id, skill.isActive)}
                        className={`px-3 py-1 text-xs rounded ${
                          skill.isActive 
                            ? 'bg-gray-200 text-gray-700 hover:bg-gray-300' 
                            : 'bg-green-200 text-green-700 hover:bg-green-300'
                        }`}
                      >
                        {skill.isActive ? 'Deactivate' : 'Activate'}
                      </button>
                      <button className="px-3 py-1 text-xs bg-blue-200 text-blue-700 rounded hover:bg-blue-300">
                        Edit
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {pagination && (
        <div className="mt-4 flex justify-between items-center">
          <div className="text-sm text-gray-600">
            Showing {(pagination.page - 1) * pagination.limit + 1} to{' '}
            {Math.min(pagination.page * pagination.limit, pagination.total)} of{' '}
            {pagination.total} results
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setFilters({...filters, page: filters.page - 1})}
              disabled={filters.page === 1}
              className="px-3 py-1 border rounded disabled:opacity-50"
            >
              Previous
            </button>
            <span className="px-3 py-1">
              Page {pagination.page} of {pagination.pages}
            </span>
            <button
              onClick={() => setFilters({...filters, page: filters.page + 1})}
              disabled={filters.page >= pagination.pages}
              className="px-3 py-1 border rounded disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default SkillsList;
```

---

## 3. Skill Edit Form

```jsx
// components/admin/SkillEditForm.jsx
import { useState, useEffect } from 'react';

const SkillEditForm = ({ skillId, onClose, onUpdate }) => {
  const [formData, setFormData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSkill();
  }, [skillId]);

  const fetchSkill = async () => {
    try {
      const response = await fetch(`/api/admin/skills/${skillId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('admin_token')}`
        }
      });
      const result = await response.json();
      if (result.success) {
        const skill = result.data.skill;
        setFormData({
          name: skill.name,
          category: skill.category,
          description: skill.description || '',
          aliases: skill.aliases ? skill.aliases.join(', ') : '',
          demandLevel: skill.demandLevel,
          trend: skill.trend,
          isActive: skill.isActive  // Can view current status
        });
      }
    } catch (error) {
      console.error('Error fetching skill:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const payload = {
      name: formData.name.trim(),
      category: formData.category,
      description: formData.description.trim(),
      aliases: formData.aliases
        .split(',')
        .map(a => a.trim())
        .filter(a => a.length > 0),
      demandLevel: formData.demandLevel,
      trend: formData.trend
      // ⚠️ Can include isActive in update, but prefer using toggle-status endpoint
    };

    try {
      const response = await fetch(`/api/admin/skills/${skillId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('admin_token')}`
        },
        body: JSON.stringify(payload)
      });

      const result = await response.json();
      if (result.success) {
        alert('✅ Skill updated successfully!');
        onUpdate(result.data.skill);
        onClose();
      }
    } catch (error) {
      console.error('Error updating skill:', error);
      alert('❌ Failed to update skill');
    }
  };

  if (loading) return <div>Loading...</div>;
  if (!formData) return <div>Skill not found</div>;

  return (
    <form onSubmit={handleSubmit} className="p-6">
      <h2 className="text-2xl font-bold mb-6">Edit Skill</h2>

      {/* Current Status Display (Read-only in form) */}
      <div className="mb-4 p-3 bg-gray-50 rounded">
        <span className="text-sm font-medium">Current Status: </span>
        <span className={`px-2 py-1 text-xs rounded ${
          formData.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
        }`}>
          {formData.isActive ? '✅ Active' : '⛔ Inactive'}
        </span>
        <p className="text-xs text-gray-500 mt-1">
          Use the Toggle Status button to change activation status
        </p>
      </div>

      {/* Rest of the form fields same as Create Form */}
      {/* ... (name, category, description, aliases, demandLevel, trend) ... */}

      <div className="flex gap-2">
        <button
          type="submit"
          className="flex-1 bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700"
        >
          Update Skill
        </button>
        <button
          type="button"
          onClick={onClose}
          className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded hover:bg-gray-400"
        >
          Cancel
        </button>
      </div>
    </form>
  );
};

export default SkillEditForm;
```

---

## 4. Bulk Operations

```jsx
// components/admin/SkillsBulkOperations.jsx
const BulkUpdateDemandLevels = () => {
  const handleBulkUpdate = async () => {
    const updates = [
      { id: 'skill_id_1', data: { demandLevel: 'critical' } },
      { id: 'skill_id_2', data: { demandLevel: 'high' } },
      { id: 'skill_id_3', data: { trend: 'emerging' } }
    ];

    try {
      const response = await fetch('/api/admin/skills/bulk/update', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('admin_token')}`
        },
        body: JSON.stringify({ updates })
      });

      const result = await response.json();
      if (result.success) {
        console.log('✅ Bulk update results:', result.data.summary);
        alert(`Updated ${result.data.summary.successful} skills`);
      }
    } catch (error) {
      console.error('Error in bulk update:', error);
    }
  };

  return (
    <button onClick={handleBulkUpdate} className="px-4 py-2 bg-blue-600 text-white rounded">
      Bulk Update Skills
    </button>
  );
};
```

---

## 5. Analytics Dashboard

```jsx
// components/admin/SkillsAnalyticsDashboard.jsx
import { useState, useEffect } from 'react';

const SkillsAnalyticsDashboard = () => {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      const response = await fetch('/api/admin/skills/analytics/overview', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('admin_token')}`
        }
      });
      const result = await response.json();
      if (result.success) {
        setAnalytics(result.data);
      }
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const syncPopularity = async () => {
    try {
      const response = await fetch('/api/admin/skills/analytics/sync', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('admin_token')}`
        }
      });
      const result = await response.json();
      if (result.success) {
        alert('✅ Skill popularity synced!');
        fetchAnalytics(); // Refresh data
      }
    } catch (error) {
      console.error('Error syncing popularity:', error);
    }
  };

  if (loading) return <div>Loading analytics...</div>;
  if (!analytics) return <div>No data available</div>;

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Skills Analytics</h2>
        <button
          onClick={syncPopularity}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          🔄 Sync Popularity
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="text-3xl font-bold text-blue-600">
            {analytics.totalSkills}
          </div>
          <div className="text-sm text-gray-600">Total Skills</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="text-3xl font-bold text-green-600">
            {analytics.activeSkills}
          </div>
          <div className="text-sm text-gray-600">Active Skills</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="text-3xl font-bold text-gray-600">
            {analytics.inactiveSkills}
          </div>
          <div className="text-sm text-gray-600">Inactive Skills</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="text-3xl font-bold text-red-600">
            {analytics.skillsWithNoUsage}
          </div>
          <div className="text-sm text-gray-600">Unused Skills</div>
        </div>
      </div>

      {/* More detailed analytics components... */}
    </div>
  );
};

export default SkillsAnalyticsDashboard;
```

---

## Key Takeaways

### ✅ Do:
- **Create:** Don't send `isActive` - it defaults to `true`
- **Update:** Can update `isActive` via PUT, but prefer PATCH toggle-status endpoint
- **Toggle:** Use dedicated `/toggle-status` endpoint for clarity
- **Display:** Show current status in UI but make it read-only in edit forms
- **Bulk Operations:** Use batch endpoints for efficiency

### ❌ Don't:
- Don't include `isActive: true` in create form
- Don't use checkboxes/toggles in create form for status
- Don't let users create inactive skills directly
- Don't use PUT to toggle status (use PATCH toggle-status instead)

### 🎯 Best Practices:
1. **Lifecycle:** Create (active) → Toggle (active/inactive) → Delete (if necessary)
2. **UI Separation:** Separate forms for creation and status management
3. **Clear Actions:** Use dedicated buttons for toggle instead of checkboxes
4. **Validation:** Always check backend response for errors
5. **Feedback:** Show clear success/error messages to users
