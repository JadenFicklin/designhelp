import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { itemsApi } from '../utils/api';
import uploadToCloudinary from '../utils/uploadToCloudinary';
import { assetsApi } from '../utils/api';
import { showConfirm, showLoading, closeAlert, showUploadSuccess, showUploadError } from '../utils/alerts';

const ImageManagerModal = ({ item, isOpen, onClose }) => {
  const queryClient = useQueryClient();
  const [uploading, setUploading] = useState(false);

  const updateItemMutation = useMutation({
    mutationFn: ({ id, data }) => itemsApi.updateItem(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['items']);
    },
  });

  const handleImageUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setUploading(true);
    showLoading('Uploading image...');
    
    try {
      const asset = await uploadToCloudinary(file);
      await assetsApi.ingest(asset);
      
      // Add the new asset to the item
      const updatedAssets = [...(item.assets || []), asset];
      await updateItemMutation.mutateAsync({
        id: item.id,
        data: { ...item, assets: updatedAssets }
      });
      
      closeAlert();
      showUploadSuccess();
    } catch (error) {
      closeAlert();
      console.error('Upload failed:', error);
      showUploadError(error);
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteImage = async (imageIndex) => {
    const result = await showConfirm(
      'Delete Image',
      'Are you sure you want to delete this image?',
      'Delete',
      'Cancel'
    );

    if (result.isConfirmed) {
      const updatedAssets = item.assets.filter((_, index) => index !== imageIndex);
      await updateItemMutation.mutateAsync({
        id: item.id,
        data: { ...item, assets: updatedAssets }
      });
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Manage Images - {item.name}</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl"
          >
            ×
          </button>
        </div>

        {/* Upload Section */}
        <div className="mb-6 p-4 border border-gray-200 rounded-lg">
          <h3 className="text-lg font-medium mb-2">Add New Image</h3>
          <input
            type="file"
            accept="image/*"
            onChange={handleImageUpload}
            disabled={uploading}
            className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
          />
          {uploading && (
            <div className="mt-2 text-sm text-gray-500">Uploading...</div>
          )}
        </div>

        {/* Images Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {item.assets && item.assets.length > 0 ? (
            item.assets.map((asset, index) => (
              <div key={index} className="relative group">
                <img
                  src={asset.url}
                  alt={asset.alt || 'Item image'}
                  className="w-full h-32 object-cover rounded-lg border border-gray-200"
                />
                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all duration-200 rounded-lg flex items-center justify-center">
                  <button
                    onClick={() => handleDeleteImage(index)}
                    className="opacity-0 group-hover:opacity-100 bg-red-600 text-white px-3 py-1 rounded text-sm transition-opacity duration-200"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-full text-center py-8 text-gray-500">
              No images uploaded yet. Upload your first image above.
            </div>
          )}
        </div>

        {/* Close Button */}
        <div className="mt-6 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default ImageManagerModal;
