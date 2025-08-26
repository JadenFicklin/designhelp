import React, { useState } from 'react';
import { showCategoryError, showConfirm } from '../utils/alerts';

const Tree = ({ 
  data, 
  selectedCategory, 
  onSelectCategory, 
  onAddCategory, 
  onUpdateCategory, 
  onDeleteCategory,
  level = 0,
  items = [] // Add items prop to count items in categories
}) => {
  const [editingId, setEditingId] = useState(null);
  const [editingName, setEditingName] = useState('');
  const [showAddForm, setShowAddForm] = useState(null);
  const [collapsedCategories, setCollapsedCategories] = useState(new Set());

  if (!data || data.length === 0) {
    return null;
  }

  // Helper function to count items in a category and its descendants
  const countItemsInCategory = (categoryId) => {
    const countDirectItems = items.filter(item => 
      item.categories?.includes(categoryId)
    ).length;
    
    // Find all descendant categories
    const getDescendantIds = (parentId) => {
      const descendants = [];
      const findDescendants = (parent) => {
        data.forEach(cat => {
          if (cat.parentId === parent) {
            descendants.push(cat.id);
            findDescendants(cat.id);
          }
        });
      };
      findDescendants(parentId);
      return descendants;
    };
    
    const descendantIds = getDescendantIds(categoryId);
    const countDescendantItems = items.filter(item => 
      item.categories?.some(catId => descendantIds.includes(catId))
    ).length;
    
    return countDirectItems + countDescendantItems;
  };

  // Helper function to toggle category collapse
  const toggleCollapse = (categoryId) => {
    setCollapsedCategories(prev => {
      const newSet = new Set(prev);
      if (newSet.has(categoryId)) {
        newSet.delete(categoryId);
      } else {
        newSet.add(categoryId);
      }
      return newSet;
    });
  };

  const handleEdit = (node) => {
    setEditingId(node.id);
    setEditingName(node.name);
  };

  const handleSave = async (node) => {
    if (editingName.trim()) {
      try {
        await onUpdateCategory(node.id, { name: editingName.trim() });
        setEditingId(null);
        setEditingName('');
      } catch (error) {
        showCategoryError(error);
      }
    }
  };

  const handleCancel = () => {
    setEditingId(null);
    setEditingName('');
  };

  const handleAddCategory = async (parentId, name) => {
    if (name.trim()) {
      try {
        await onAddCategory({ name: name.trim(), parentId });
        setShowAddForm(null);
      } catch (error) {
        showCategoryError(error);
      }
    }
  };

  const handleDeleteCategory = async (node) => {
    const result = await showConfirm(
      'Delete Category',
      `Are you sure you want to delete "${node.name}"? This action cannot be undone.`,
      'Delete',
      'Cancel'
    );

    if (result.isConfirmed) {
      try {
        await onDeleteCategory(node.id);
      } catch (error) {
        showCategoryError(error);
      }
    }
  };

  return (
    <div className="space-y-1">
      {/* Global View Option - only show at root level */}
      {level === 0 && (
        <>
          <div className="flex items-center group">
            <button
              onClick={() => onSelectCategory(selectedCategory === 'global' ? null : 'global')}
              className={`flex-1 text-left px-2 py-1 rounded text-sm transition-colors ${
                selectedCategory === 'global'
                  ? 'bg-blue-100 text-blue-700 font-medium'
                  : 'hover:bg-gray-100 text-gray-700'
              }`}
              style={{ paddingLeft: '8px' }}
            >
              <span>🌐 Global View</span>
            </button>
          </div>
          
          {/* Divider */}
          <div className="border-t border-gray-200 my-2"></div>
        </>
      )}
      
      {data.map((node) => (
        <div key={node.id}>
          <div className="flex items-center group">
                         <div className="flex items-center">
               {/* Collapse/Expand button for categories with children */}
               {node.children && node.children.length > 0 && (
                 <button
                   onClick={(e) => {
                     e.stopPropagation();
                     toggleCollapse(node.id);
                   }}
                   className="mr-1 text-gray-400 hover:text-gray-600 transition-colors"
                   title={collapsedCategories.has(node.id) ? "Expand" : "Collapse"}
                 >
                   {collapsedCategories.has(node.id) ? "▶" : "▼"}
                 </button>
               )}
               
               <button
                 onClick={() => onSelectCategory(node.id === selectedCategory ? null : node.id)}
                 className={`flex-1 text-left px-2 py-1 rounded text-sm transition-colors ${
                   selectedCategory === node.id
                     ? 'bg-blue-100 text-blue-700 font-medium'
                     : 'hover:bg-gray-100 text-gray-700'
                 }`}
                 style={{ paddingLeft: `${level * 12 + 8}px` }}
               >
                 {editingId === node.id ? (
                   <input
                     type="text"
                     value={editingName}
                     onChange={(e) => setEditingName(e.target.value)}
                     onKeyDown={(e) => {
                       if (e.key === 'Enter') handleSave(node);
                       if (e.key === 'Escape') handleCancel();
                     }}
                     className="w-full bg-white border border-gray-300 rounded px-1 py-0.5 text-sm"
                     autoFocus
                   />
                 ) : (
                   <span>{node.name}</span>
                 )}
                 
                 {/* Show item count instead of child count */}
                 <span className="ml-1 text-xs text-gray-500">
                   ({countItemsInCategory(node.id)})
                 </span>
               </button>
             </div>
            
            {/* Action buttons - only show on hover */}
            <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center space-x-1 ml-2">
              {editingId === node.id ? (
                <>
                  <button
                    onClick={() => handleSave(node)}
                    className="text-green-600 hover:text-green-700 text-xs"
                    title="Save"
                  >
                    ✓
                  </button>
                  <button
                    onClick={handleCancel}
                    className="text-red-600 hover:text-red-700 text-xs"
                    title="Cancel"
                  >
                    ✕
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => setShowAddForm(showAddForm === node.id ? null : node.id)}
                    className="text-blue-600 hover:text-blue-700 text-xs"
                    title="Add subcategory"
                  >
                    +
                  </button>
                  <button
                    onClick={() => handleEdit(node)}
                    className="text-gray-600 hover:text-gray-700 text-xs"
                    title="Rename"
                  >
                    ✎
                  </button>
                  {node.id !== 'root' && (
                    <button
                      onClick={() => handleDeleteCategory(node)}
                      className="text-red-600 hover:text-red-700 text-xs"
                      title="Delete"
                    >
                      🗑
                    </button>
                  )}
                </>
              )}
            </div>
          </div>
          
          {/* Add category form */}
          {showAddForm === node.id && (
            <div className="ml-4 mt-1">
              <div className="flex items-center space-x-1">
                <input
                  type="text"
                  placeholder="Category name"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleAddCategory(node.id, e.target.value);
                      e.target.value = '';
                    }
                    if (e.key === 'Escape') setShowAddForm(null);
                  }}
                  className="flex-1 text-sm border border-gray-300 rounded px-2 py-1"
                  autoFocus
                />
                <button
                  onClick={(e) => {
                    const input = e.target.previousSibling;
                    handleAddCategory(node.id, input.value);
                    input.value = '';
                  }}
                  className="text-green-600 hover:text-green-700 text-xs px-1"
                >
                  ✓
                </button>
                <button
                  onClick={() => setShowAddForm(null)}
                  className="text-red-600 hover:text-red-700 text-xs px-1"
                >
                  ✕
                </button>
              </div>
            </div>
          )}
          
                     {/* Recursive children */}
           {node.children && node.children.length > 0 && !collapsedCategories.has(node.id) && (
             <Tree
               data={node.children}
               selectedCategory={selectedCategory}
               onSelectCategory={onSelectCategory}
               onAddCategory={onAddCategory}
               onUpdateCategory={onUpdateCategory}
               onDeleteCategory={onDeleteCategory}
               level={level + 1}
               items={items}
             />
           )}
        </div>
      ))}
    </div>
  );
};

export default Tree;
