import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { itemsApi } from '../utils/api';
import { showItemUpdated, showUpdateItemError, showLoading } from '../utils/alerts';

const ItemDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState(false);
  const [editData, setEditData] = useState({});

  // Query for item data
  const { data: item, isLoading, error } = useQuery({
    queryKey: ['item', id],
    queryFn: () => itemsApi.getItem(id),
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => itemsApi.updateItem(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['item', id]);
      queryClient.invalidateQueries(['items']);
      setEditing(false);
      showItemUpdated();
    },
    onError: (error) => {
      showUpdateItemError(error);
    },
  });

  // Handlers
  const handleEdit = () => {
    setEditData({
      cost: item.cost,
      currency: item.currency,
    });
    setEditing(true);
  };

  const handleSave = () => {
    showLoading('Updating item...');
    updateMutation.mutate({
      id,
      data: editData,
    });
  };

  const handleCancel = () => {
    setEditing(false);
    setEditData({});
  };

  const formatCost = (cost, currency) => {
    if (cost === null || cost === undefined) return 'N/A';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency || 'USD',
    }).format(cost);
  };

  const formatDimensions = (dimensions) => {
    if (!dimensions || Object.keys(dimensions).length === 0) return 'N/A';
    
    const parts = [];
    if (dimensions.width) parts.push(`${dimensions.width}${dimensions.unit || ''}`);
    if (dimensions.height) parts.push(`${dimensions.height}${dimensions.unit || ''}`);
    if (dimensions.depth) parts.push(`${dimensions.depth}${dimensions.unit || ''}`);
    if (dimensions.thickness) parts.push(`${dimensions.thickness}${dimensions.unit || ''}`);
    
    return parts.length > 0 ? parts.join(' × ') : 'N/A';
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
        <div className="text-red-600 mb-4">Error loading item</div>
        <button
          onClick={() => navigate('/')}
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
        >
          Back to Library
        </button>
      </div>
    );
  }

  if (!item) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
        <div className="text-gray-600 mb-4">Item not found</div>
        <button
          onClick={() => navigate('/')}
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
        >
          Back to Library
        </button>
      </div>
    );
  }

  const mainImage = item.assets && item.assets.length > 0 ? item.assets[0] : null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={() => navigate('/')}
            className="text-blue-600 hover:text-blue-700 flex items-center"
          >
            ← Back to Library
          </button>
          <button
            onClick={handleEdit}
            disabled={editing}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            Edit
          </button>
        </div>
        
        <h1 className="text-2xl font-bold text-gray-900 mb-2">{item.name}</h1>
        <p className="text-gray-600">{item.description}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Media Panel */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Media</h2>
          {mainImage ? (
            <img
              src={mainImage.url}
              alt={mainImage.alt || item.name}
              className="w-full h-64 object-cover rounded-lg"
            />
          ) : (
            <div className="w-full h-64 bg-gray-100 rounded-lg flex items-center justify-center">
              <div className="text-gray-400 text-center">
                <div className="text-4xl mb-2">📄</div>
                <div>No Image</div>
              </div>
            </div>
          )}
        </div>

        {/* Basics Panel */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Basics</h2>
          
          {editing ? (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Cost
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={editData.cost || ''}
                  onChange={(e) => setEditData({ ...editData, cost: parseFloat(e.target.value) || null })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Currency
                </label>
                <select
                  value={editData.currency || 'USD'}
                  onChange={(e) => setEditData({ ...editData, currency: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="USD">USD</option>
                  <option value="EUR">EUR</option>
                  <option value="GBP">GBP</option>
                  <option value="CAD">CAD</option>
                </select>
              </div>
              
              <div className="flex space-x-2">
                <button
                  onClick={handleSave}
                  disabled={updateMutation.isPending}
                  className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 disabled:opacity-50"
                >
                  {updateMutation.isPending ? 'Saving...' : 'Save'}
                </button>
                <button
                  onClick={handleCancel}
                  className="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <div>
                <span className="text-sm font-medium text-gray-700">Cost:</span>
                <div className="text-lg font-semibold text-green-600">
                  {formatCost(item.cost, item.currency)}
                </div>
              </div>
              
              <div>
                <span className="text-sm font-medium text-gray-700">Type:</span>
                <div className="text-sm text-gray-900 capitalize">{item.kind}</div>
              </div>
              
              <div>
                <span className="text-sm font-medium text-gray-700">Dimensions:</span>
                <div className="text-sm text-gray-900">{formatDimensions(item.dimensions)}</div>
              </div>
            </div>
          )}
        </div>

        {/* Dimensions Panel */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Dimensions</h2>
          <pre className="bg-gray-50 p-4 rounded-lg text-sm overflow-x-auto">
            {JSON.stringify(item.dimensions, null, 2)}
          </pre>
        </div>

        {/* Attributes Panel */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Attributes</h2>
          <pre className="bg-gray-50 p-4 rounded-lg text-sm overflow-x-auto">
            {JSON.stringify(item.attributes, null, 2)}
          </pre>
        </div>

        {/* Categories & Tags */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 lg:col-span-2">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Categories</h2>
              <div className="flex flex-wrap gap-2">
                {item.categories && item.categories.length > 0 ? (
                  item.categories.map((category) => (
                    <span
                      key={category}
                      className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm"
                    >
                      {category}
                    </span>
                  ))
                ) : (
                  <span className="text-gray-500">No categories</span>
                )}
              </div>
            </div>
            
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Tags</h2>
              <div className="flex flex-wrap gap-2">
                {item.tags && item.tags.length > 0 ? (
                  item.tags.map((tag) => (
                    <span
                      key={tag}
                      className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-sm"
                    >
                      #{tag}
                    </span>
                  ))
                ) : (
                  <span className="text-gray-500">No tags</span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ItemDetail;
