import React, { useState, useRef, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { itemsApi } from '../utils/api';
import ImageManagerModal from './ImageManagerModal';

const SpreadsheetView = ({ items, categories = [] }) => {
  const queryClient = useQueryClient();
  const [editingCell, setEditingCell] = useState(null);
  const [editValue, setEditValue] = useState('');
  const [editPosition, setEditPosition] = useState({ x: 0, y: 0 });
  const inputRef = useRef(null);
  const [imageModalOpen, setImageModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [selectedItemForDetail, setSelectedItemForDetail] = useState(null);

  const updateItemMutation = useMutation({
    mutationFn: ({ id, data }) => itemsApi.updateItem(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['items']);
    },
  });

  const deleteItemMutation = useMutation({
    mutationFn: itemsApi.deleteItem,
    onSuccess: () => {
      queryClient.invalidateQueries(['items']);
    },
  });

  // Focus input when editing starts
  useEffect(() => {
    if (editingCell && inputRef.current) {
      inputRef.current.focus();
      // Only call select() on input elements, not select elements
      if (inputRef.current.tagName === 'INPUT') {
        inputRef.current.select();
      }
    }
  }, [editingCell]);

  const handleCellClick = (itemId, field, value, event) => {
    const rect = event.currentTarget.getBoundingClientRect();
    setEditPosition({
      x: rect.left,
      y: rect.bottom + 5
    });
    setEditingCell({ itemId, field });
    
    // For categories, we need to get the first category ID for the dropdown
    if (field === 'categories') {
      const item = items.find(item => item.id === itemId);
      const categoryIds = item?.categories || [];
      setEditValue(categoryIds.length > 0 ? categoryIds[0] : '');
    } else {
      setEditValue(value || '');
    }
  };

  const handleCellEdit = async () => {
    if (!editingCell) return;

    const { itemId, field } = editingCell;
    const item = items.find(item => item.id === itemId);
    if (!item) return;

    // Parse the value based on field type
    let parsedValue = editValue;
    if (field === 'cost') {
      parsedValue = editValue === '' ? null : (isNaN(parseFloat(editValue)) ? null : parseFloat(editValue));
    } else if (field === 'categories') {
      // For categories dropdown, the value is already a category ID
      parsedValue = editValue ? [editValue] : [];
    } else if (field === 'tags') {
      parsedValue = editValue.split(',').map(tag => tag.trim()).filter(Boolean);
    } else if (field === 'dimensions') {
      try {
        parsedValue = editValue === '' ? {} : JSON.parse(editValue);
      } catch (error) {
        // If JSON parsing fails, keep the original value
        setEditingCell(null);
        setEditValue('');
        return;
      }
    }

    // Update the item
    const updatedItem = { ...item, [field]: parsedValue };
    await updateItemMutation.mutateAsync({ id: itemId, data: updatedItem });

    setEditingCell(null);
    setEditValue('');
  };

  const handleDeleteItem = async (itemId) => {
    await deleteItemMutation.mutateAsync(itemId);
  };

  const handleOpenImageModal = (item) => {
    setSelectedItem(item);
    setImageModalOpen(true);
  };

  const handleCloseImageModal = () => {
    setImageModalOpen(false);
    setSelectedItem(null);
  };

  const handleRowNumberClick = (item) => {
    setSelectedItemForDetail(item);
    setDetailModalOpen(true);
  };

  const handleCloseDetailModal = () => {
    setDetailModalOpen(false);
    setSelectedItemForDetail(null);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleCellEdit();
    } else if (e.key === 'Escape') {
      setEditingCell(null);
      setEditValue('');
    }
  };

  const getCategoryName = (categoryId) => {
    const category = categories.find(cat => cat.id === categoryId);
    return category ? category.name : categoryId;
  };

  const formatValue = (value, field) => {
    if (value === null || value === undefined) return '';
    
    if (field === 'categories') {
      return Array.isArray(value) ? value.map(getCategoryName).join(', ') : '';
    }
    
    if (field === 'tags') {
      return Array.isArray(value) ? value.join(', ') : '';
    }
    
    if (field === 'dimensions') {
      return typeof value === 'object' ? JSON.stringify(value) : value;
    }
    
    if (field === 'cost') {
      return value ? `$${parseFloat(value).toFixed(2)}` : '';
    }
    
    return String(value);
  };

  const truncateText = (text, maxLength = 50) => {
    if (!text) return '';
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  const getFieldType = (field) => {
    switch (field) {
      case 'cost':
        return 'number';
      case 'categories':
      case 'tags':
        return 'text';
      case 'dimensions':
        return 'text';
      default:
        return 'text';
    }
  };

  const getAvailableOptions = (field) => {
    if (field === 'kind') {
      return ['material', 'object', 'text', 'note'];
    }
    if (field === 'categories') {
      return categories;
    }
    return [];
  };

  const columns = [
    { key: 'name', label: 'Name', width: '200px' },
    { key: 'kind', label: 'Type', width: '120px' },
    { key: 'description', label: 'Description', width: '250px' },
    { key: 'categories', label: 'Categories', width: '150px' },
    { key: 'tags', label: 'Tags', width: '150px' },
    { key: 'cost', label: 'Cost', width: '100px' },
    { key: 'dimensions', label: 'Dimensions', width: '150px' },
    { key: 'assets', label: 'Images', width: '100px' },
    { key: 'actions', label: 'Actions', width: '100px' },
  ];

    return (
    <>
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-16">
                  #
                </th>
                {columns.map((column) => (
                  <th
                    key={column.key}
                    className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    style={{ width: column.width }}
                  >
                    {column.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {items.map((item, index) => (
                                 <tr key={item.id} className="hover:bg-gray-50">
                   <td 
                     className="px-4 py-3 text-sm text-gray-500 border-r border-gray-100 cursor-pointer hover:bg-blue-50 transition-colors"
                     onClick={() => handleRowNumberClick(item)}
                     title="Click to view details"
                   >
                     {index + 1}
                   </td>
                  {columns.map((column) => {
                     const value = item[column.key];
                     const displayValue = formatValue(value, column.key);
                     const truncatedValue = column.key === 'description' ? truncateText(displayValue, 25) : displayValue;
                    
                                         // Special handling for different column types
                     if (column.key === 'kind') {
                       return (
                         <td key={column.key} className="px-4 py-3 text-sm text-gray-900 border-r border-gray-100">
                           <div
                             className="cursor-pointer hover:bg-blue-50 px-2 py-1 rounded -mx-2 transition-colors"
                             onClick={(e) => handleCellClick(item.id, column.key, displayValue, e)}
                             title="Click to edit"
                           >
                             {displayValue || <span className="text-gray-400 italic">Click to edit</span>}
                           </div>
                         </td>
                       );
                     }
                     
                     if (column.key === 'categories') {
                       return (
                         <td key={column.key} className="px-4 py-3 text-sm text-gray-900 border-r border-gray-100">
                           <div
                             className="cursor-pointer hover:bg-blue-50 px-2 py-1 rounded -mx-2 transition-colors"
                             onClick={(e) => handleCellClick(item.id, column.key, displayValue, e)}
                             title="Click to edit"
                           >
                             {displayValue || <span className="text-gray-400 italic">Click to edit</span>}
                           </div>
                         </td>
                       );
                     }
                    
                    if (column.key === 'assets') {
                      return (
                        <td key={column.key} className="px-4 py-3 text-sm text-gray-900 border-r border-gray-100">
                          <button
                            onClick={() => handleOpenImageModal(item)}
                            className="px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 transition-colors"
                          >
                            {item.assets && item.assets.length > 0 ? `${item.assets.length} image${item.assets.length !== 1 ? 's' : ''}` : 'Add Images'}
                          </button>
                        </td>
                      );
                    }
                    
                    if (column.key === 'actions') {
                      return (
                        <td key={column.key} className="px-4 py-3 text-sm text-gray-900 border-r border-gray-100">
                          <button
                            onClick={() => handleDeleteItem(item.id)}
                            className="px-3 py-1 bg-red-600 text-white text-xs rounded hover:bg-red-700 transition-colors"
                          >
                            Delete
                          </button>
                        </td>
                      );
                    }
                    
                                         return (
                       <td
                         key={column.key}
                         className="px-4 py-3 text-sm text-gray-900 border-r border-gray-100"
                       >
                         <div
                           className="cursor-pointer hover:bg-blue-50 px-2 py-1 rounded -mx-2 transition-colors"
                           onClick={(e) => handleCellClick(item.id, column.key, displayValue, e)}
                           title={column.key === 'description' && displayValue.length > 25 ? displayValue : "Click to edit"}
                         >
                           {truncatedValue || <span className="text-gray-400 italic">Click to edit</span>}
                         </div>
                       </td>
                     );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
                 {items.length === 0 && (
           <div className="text-center py-8 text-gray-500">
             No items found. Create your first item to see it in the spreadsheet view.
           </div>
         )}
       </div>
       
       {/* Floating Edit Bubble */}
       {editingCell && (
         <div
           className="fixed z-50 bg-white border border-gray-300 rounded-lg shadow-lg p-4 min-w-[300px]"
           style={{
             left: `${editPosition.x}px`,
             top: `${editPosition.y}px`
           }}
         >
           <div className="flex items-center justify-between mb-2">
             <span className="text-sm font-medium text-gray-700">
               Edit {editingCell.field}
             </span>
             <button
               onClick={() => {
                 setEditingCell(null);
                 setEditValue('');
               }}
               className="text-gray-400 hover:text-gray-600"
             >
               <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
               </svg>
             </button>
           </div>
           
           {editingCell.field === 'kind' ? (
             <select
               ref={inputRef}
               value={editValue}
               onChange={(e) => setEditValue(e.target.value)}
               onKeyDown={handleKeyDown}
               className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
             >
               {getAvailableOptions('kind').map(option => (
                 <option key={option} value={option}>{option}</option>
               ))}
             </select>
           ) : editingCell.field === 'categories' ? (
             <select
               ref={inputRef}
               value={editValue}
               onChange={(e) => setEditValue(e.target.value)}
               onKeyDown={handleKeyDown}
               className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
             >
               <option value="">No category</option>
               {getAvailableOptions('categories').map(category => (
                 <option key={category.id} value={category.id}>{category.name}</option>
               ))}
             </select>
           ) : (
             <input
               ref={inputRef}
               type={getFieldType(editingCell.field)}
               value={editValue}
               onChange={(e) => setEditValue(e.target.value)}
               onKeyDown={handleKeyDown}
               className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
               placeholder={editingCell.field === 'cost' ? '0.00' : 'Enter value...'}
             />
           )}
           
           <div className="flex justify-end space-x-2 mt-3">
             <button
               onClick={() => {
                 setEditingCell(null);
                 setEditValue('');
               }}
               className="px-3 py-1 text-sm text-gray-600 hover:text-gray-800"
             >
               Cancel
             </button>
             <button
               onClick={handleCellEdit}
               className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
             >
               Save
             </button>
           </div>
         </div>
       )}
       
       {/* Item Detail Modal */}
       {detailModalOpen && selectedItemForDetail && (
         <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
           <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
             <div className="flex items-center justify-between p-6 border-b border-gray-200">
               <h2 className="text-xl font-semibold text-gray-900">
                 Item Details
               </h2>
               <button
                 onClick={handleCloseDetailModal}
                 className="text-gray-400 hover:text-gray-600"
               >
                 <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                 </svg>
               </button>
             </div>
             
             <div className="p-6 space-y-6">
               {/* Basic Information */}
               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 <div>
                   <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                   <div className="text-lg font-semibold text-gray-900">{selectedItemForDetail.name}</div>
                 </div>
                 
                 <div>
                   <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                   <div className="text-sm text-gray-900 capitalize">{selectedItemForDetail.kind}</div>
                 </div>
                 
                 <div className="md:col-span-2">
                   <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                   <div className="text-sm text-gray-900 bg-gray-50 p-3 rounded-md">
                     {selectedItemForDetail.description || 'No description'}
                   </div>
                 </div>
                 
                 <div>
                   <label className="block text-sm font-medium text-gray-700 mb-1">Cost</label>
                   <div className="text-lg font-semibold text-green-600">
                     {selectedItemForDetail.cost ? `$${parseFloat(selectedItemForDetail.cost).toFixed(2)}` : 'N/A'}
                   </div>
                 </div>
                 
                 <div>
                   <label className="block text-sm font-medium text-gray-700 mb-1">Created</label>
                   <div className="text-sm text-gray-900">
                     {selectedItemForDetail.createdAt ? new Date(selectedItemForDetail.createdAt).toLocaleDateString() : 'N/A'}
                   </div>
                 </div>
               </div>
               
               {/* Categories & Tags */}
               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 <div>
                   <label className="block text-sm font-medium text-gray-700 mb-2">Categories</label>
                   <div className="flex flex-wrap gap-2">
                     {selectedItemForDetail.categories && selectedItemForDetail.categories.length > 0 ? (
                       selectedItemForDetail.categories.map((categoryId) => {
                         const category = categories.find(cat => cat.id === categoryId);
                         return (
                           <span
                             key={categoryId}
                             className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm"
                           >
                             {category ? category.name : categoryId}
                           </span>
                         );
                       })
                     ) : (
                       <span className="text-gray-500">No categories</span>
                     )}
                   </div>
                 </div>
                 
                 <div>
                   <label className="block text-sm font-medium text-gray-700 mb-2">Tags</label>
                   <div className="flex flex-wrap gap-2">
                     {selectedItemForDetail.tags && selectedItemForDetail.tags.length > 0 ? (
                       selectedItemForDetail.tags.map((tag) => (
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
               
               {/* Dimensions */}
               <div>
                 <label className="block text-sm font-medium text-gray-700 mb-2">Dimensions</label>
                 <div className="bg-gray-50 p-3 rounded-md">
                   <pre className="text-sm text-gray-900 whitespace-pre-wrap">
                     {selectedItemForDetail.dimensions && Object.keys(selectedItemForDetail.dimensions).length > 0 
                       ? JSON.stringify(selectedItemForDetail.dimensions, null, 2)
                       : 'No dimensions specified'
                     }
                   </pre>
                 </div>
               </div>
               
               {/* Images */}
               <div>
                 <label className="block text-sm font-medium text-gray-700 mb-2">Images</label>
                 <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                   {selectedItemForDetail.assets && selectedItemForDetail.assets.length > 0 ? (
                     selectedItemForDetail.assets.map((asset, index) => (
                       <div key={index} className="aspect-square bg-gray-100 rounded-lg overflow-hidden">
                         <img
                           src={asset.url}
                           alt={asset.alt || `Image ${index + 1}`}
                           className="w-full h-full object-cover"
                         />
                       </div>
                     ))
                   ) : (
                     <span className="text-gray-500 col-span-full">No images</span>
                   )}
                 </div>
               </div>
             </div>
             
             <div className="flex justify-end p-6 border-t border-gray-200">
               <button
                 onClick={handleCloseDetailModal}
                 className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
               >
                 Close
               </button>
             </div>
           </div>
         </div>
       )}
      
      {/* Image Manager Modal */}
      {selectedItem && (
        <ImageManagerModal
          item={selectedItem}
          isOpen={imageModalOpen}
          onClose={handleCloseImageModal}
        />
      )}
    </>
  );
 };

export default SpreadsheetView;
