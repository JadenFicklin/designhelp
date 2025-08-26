import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { itemsApi, categoriesApi } from '../utils/api';
import useFilters from '../store/useFilters';
import Tree from '../components/Tree';
import ItemCard from '../components/ItemCard';
import CreateItemForm from '../components/CreateItemForm';
import { 
  showImportSuccess, 
  showExportSuccess, 
  showImportError, 
  showExportError,
  showCategoryError,
  showConfirm
} from '../utils/alerts';

const Library = () => {
  const queryClient = useQueryClient();
  const { query, selectedCategory, selectedTags, setQuery, setSelectedCategory, getFilters } = useFilters();
  const [importFile, setImportFile] = useState(null);

  // Queries
  const { data: items = [], isLoading: itemsLoading } = useQuery({
    queryKey: ['items', getFilters()],
    queryFn: () => itemsApi.getItems(getFilters()),
  });

  const { data: categoriesTree = [], isLoading: categoriesLoadingTree } = useQuery({
    queryKey: ['categories-tree'],
    queryFn: () => categoriesApi.getTree(),
  });

  const { data: allCategories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: () => categoriesApi.getAll(),
  });

  // Mutations


  const importMutation = useMutation({
    mutationFn: itemsApi.importItems,
    onSuccess: (data) => {
      queryClient.invalidateQueries(['items']);
      queryClient.invalidateQueries(['categories-tree']);
      setImportFile(null);
      showImportSuccess(data.count || 0);
    },
    onError: (error) => {
      showImportError(error);
    },
  });

  const createItemMutation = useMutation({
    mutationFn: itemsApi.createItem,
    onSuccess: () => {
      queryClient.invalidateQueries(['items']);
    },
  });

  const addCategoryMutation = useMutation({
    mutationFn: categoriesApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries(['categories-tree']);
      queryClient.invalidateQueries(['categories']);
    },
    onError: (error) => {
      showCategoryError(error);
    },
  });

  const updateCategoryMutation = useMutation({
    mutationFn: ({ id, data }) => categoriesApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['categories-tree']);
      queryClient.invalidateQueries(['categories']);
    },
    onError: (error) => {
      showCategoryError(error);
    },
  });

  const deleteCategoryMutation = useMutation({
    mutationFn: categoriesApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries(['categories-tree']);
      queryClient.invalidateQueries(['categories']);
    },
    onError: (error) => {
      showCategoryError(error);
    },
  });



  // Handlers
  const handleExport = async () => {
    try {
      const data = await itemsApi.exportItems();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'design-vault-export.json';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      showExportSuccess();
    } catch (error) {
      console.error('Export failed:', error);
      showExportError(error);
    }
  };

  const handleImport = async () => {
    if (!importFile) return;

    const result = await showConfirm(
      'Import Data',
      'This will replace all existing items. Are you sure you want to continue?',
      'Import',
      'Cancel'
    );

    if (!result.isConfirmed) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const data = JSON.parse(e.target.result);
        await importMutation.mutateAsync(data);
      } catch (error) {
        console.error('Import failed:', error);
        showImportError(error);
      }
    };
    reader.readAsText(importFile);
  };



  const handleCreateItem = async (itemData) => {
    await createItemMutation.mutateAsync(itemData);
  };

  const handleAddCategory = async (categoryData) => {
    await addCategoryMutation.mutateAsync(categoryData);
  };

  const handleUpdateCategory = async (id, data) => {
    await updateCategoryMutation.mutateAsync({ id, data });
  };

  const handleDeleteCategory = async (id) => {
    try {
      await deleteCategoryMutation.mutateAsync(id);
    } catch (error) {
      // Error is already handled by the mutation
    }
  };

  return (
    <div className="flex gap-6">
      {/* Left Sidebar - File Structure */}
      <div className="w-80 flex-shrink-0">
        <div className="space-y-6">
          {/* Create Item Form */}
          <CreateItemForm
            onSubmit={handleCreateItem}
            categories={allCategories}
          />

          {/* Search */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Search
            </label>
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search items..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Categories Tree */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-gray-700">
                Categories {categoriesLoadingTree ? '(Loading...)' : `(${categoriesTree.length})`}
              </label>
              <button
                onClick={() => handleAddCategory({ name: 'New Category', parentId: null })}
                className="text-blue-600 hover:text-blue-700 text-xs"
                title="Add root category"
              >
                +
              </button>
            </div>
            <div className="max-h-64 overflow-y-auto">
              {categoriesLoadingTree ? (
                <div className="text-sm text-gray-500 py-2">Loading categories...</div>
                             ) : categoriesTree.length === 0 ? (
                 <div className="text-sm text-gray-500 py-2">
                   No categories found. Click + to add one.
                 </div>
              ) : (
                <Tree
                  data={categoriesTree}
                  selectedCategory={selectedCategory}
                  onSelectCategory={setSelectedCategory}
                  onAddCategory={handleAddCategory}
                  onUpdateCategory={handleUpdateCategory}
                  onDeleteCategory={handleDeleteCategory}
                />
              )}
            </div>
          </div>

                     {/* Actions */}
           <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 space-y-3">
             <button
               onClick={handleExport}
               className="w-full bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700"
             >
               Export JSON
             </button>
           </div>

          {/* Import */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Import JSON
            </label>
            <input
              type="file"
              accept=".json"
              onChange={(e) => setImportFile(e.target.files[0])}
              className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
            />
            {importFile && (
              <button
                onClick={handleImport}
                disabled={importMutation.isPending}
                className="w-full mt-2 bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700 disabled:opacity-50"
              >
                {importMutation.isPending ? 'Importing...' : 'Import'}
              </button>
            )}
          </div>

          
        </div>
      </div>

      {/* Main Content - Items Grid */}
      <div className="flex-1">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">
                Library ({items.length} items)
              </h2>
              {(query || selectedCategory || selectedTags.length > 0) && (
                <p className="text-sm text-gray-500 mt-1">
                  Filtered results
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Items Grid */}
        {itemsLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="bg-white rounded-lg shadow-sm border border-gray-200 animate-pulse">
                <div className="h-48 bg-gray-200 rounded-t-lg"></div>
                <div className="p-4 space-y-2">
                  <div className="h-4 bg-gray-200 rounded"></div>
                  <div className="h-3 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-6 bg-gray-200 rounded w-1/2"></div>
                </div>
              </div>
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
            <div className="text-6xl mb-4">📚</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No items found
            </h3>
                         <p className="text-gray-500 mb-4">
               {query || selectedCategory || selectedTags.length > 0
                 ? 'Try adjusting your filters or search terms.'
                 : 'Get started by creating your first item.'}
             </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {items.map((item) => (
              <ItemCard key={item.id} item={item} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Library;
