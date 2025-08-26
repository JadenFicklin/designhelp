import React from 'react';
import { Link } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { itemsApi } from '../utils/api';
import { showConfirm } from '../utils/alerts';

const ItemCard = ({ item }) => {
  const queryClient = useQueryClient();
  const mainImage = item.assets && item.assets.length > 0 ? item.assets[0] : null;

  const deleteItemMutation = useMutation({
    mutationFn: itemsApi.deleteItem,
    onSuccess: () => {
      queryClient.invalidateQueries(['items']);
    },
  });

  const handleDelete = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    const result = await showConfirm(
      'Delete Item',
      'Are you sure you want to delete this item? This action cannot be undone.',
      'Delete',
      'Cancel'
    );

    if (result.isConfirmed) {
      await deleteItemMutation.mutateAsync(item.id);
    }
  };
  
  const formatCost = (cost) => {
    if (cost === null || cost === undefined) return 'N/A';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
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

  return (
    <div className="relative bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow duration-200">
      {/* Delete Button */}
      <button
        onClick={handleDelete}
        className="absolute top-2 right-2 z-10 bg-red-600 text-white p-1 rounded-full hover:bg-red-700 transition-colors opacity-0 group-hover:opacity-100"
        title="Delete item"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
      
      <Link
        to={`/item/${item.id}`}
        className="block group"
      >
      <div className="aspect-w-16 aspect-h-9 bg-gray-100 rounded-t-lg overflow-hidden">
        {mainImage ? (
          <img
            src={mainImage.url}
            alt={mainImage.alt || item.name}
            className="w-full h-48 object-cover"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-48 flex items-center justify-center bg-gray-100">
            <div className="text-gray-400 text-center">
              <div className="text-4xl mb-2">📄</div>
              <div className="text-sm">No Image</div>
            </div>
          </div>
        )}
      </div>
      
      <div className="p-4">
        <h3 className="font-medium text-gray-900 mb-1 line-clamp-2">
          {item.name}
        </h3>
        
        {item.description && (
          <p className="text-sm text-gray-600 mb-2 line-clamp-2">
            {item.description}
          </p>
        )}
        
        <div className="flex items-center justify-between mb-2">
          <span className="text-lg font-semibold text-green-600">
            {formatCost(item.cost)}
          </span>
          <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
            {item.kind}
          </span>
        </div>
        
        <div className="text-xs text-gray-500 mb-2">
          {formatDimensions(item.dimensions)}
        </div>
        
        {item.categories && item.categories.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-2">
            {item.categories.slice(0, 2).map((category) => (
              <span
                key={category}
                className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded"
              >
                {category}
              </span>
            ))}
            {item.categories.length > 2 && (
              <span className="text-xs text-gray-500">
                +{item.categories.length - 2} more
              </span>
            )}
          </div>
        )}
        
        {item.tags && item.tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {item.tags.slice(0, 3).map((tag) => (
              <span
                key={tag}
                className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded"
              >
                #{tag}
              </span>
            ))}
            {item.tags.length > 3 && (
              <span className="text-xs text-gray-500">
                +{item.tags.length - 3} more
              </span>
            )}
          </div>
        )}
      </div>
      </Link>
    </div>
  );
};

export default ItemCard;
