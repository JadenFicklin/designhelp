import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { showItemCreated, showCreateItemError, showLoading, closeAlert, showUploadError } from '../utils/alerts';
import uploadToCloudinary from '../utils/uploadToCloudinary';
import { assetsApi } from '../utils/api';

const CreateItemForm = ({ onSubmit, onCancel, categories = [] }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadedImages, setUploadedImages] = useState([]);
  const [uploadingImage, setUploadingImage] = useState(false);
  const { register, handleSubmit, reset, formState: { errors } } = useForm();


  const handleImageUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setUploadingImage(true);
    showLoading('Uploading image...');
    
    try {
      const asset = await uploadToCloudinary(file);
      await assetsApi.ingest(asset);
      
      setUploadedImages(prev => [...prev, asset]);
      closeAlert();
    } catch (error) {
      closeAlert();
      console.error('Upload failed:', error);
      showUploadError(error);
    } finally {
      setUploadingImage(false);
    }
  };

  const removeImage = (index) => {
    setUploadedImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleFormSubmit = async (data) => {
    setIsSubmitting(true);
    showLoading('Creating item...');
    
    try {
      // Process dimensions from the new form structure
      let dimensions = {};
      if (data.dimensions) {
        const { width, height, depth, unit } = data.dimensions;
        if (width || height || depth || unit) {
          dimensions = {
            ...(width && { width: parseFloat(width) }),
            ...(height && { height: parseFloat(height) }),
            ...(depth && { depth: parseFloat(depth) }),
            ...(unit && { unit })
          };
        }
      }

      // Process form data
      const processedData = {
        ...data,
        cost: data.cost ? (isNaN(parseFloat(data.cost)) ? null : parseFloat(data.cost)) : null,
        categories: Array.isArray(data.categories) ? data.categories : [data.categories].filter(Boolean),
        tags: data.tags ? data.tags.split(',').map(tag => tag.trim()).filter(Boolean) : [],
        dimensions,
        assets: uploadedImages
      };

      await onSubmit(processedData);
      closeAlert();
      showItemCreated();
      reset();
      setUploadedImages([]);
      setIsOpen(false);
    } catch (error) {
      closeAlert();
      console.error('Failed to create item:', error);
      showCreateItemError(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    reset();
    setUploadedImages([]);
    setIsOpen(false);
    onCancel?.();
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="w-full bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors"
      >
        + Create New Item
      </button>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Create New Item</h3>
      
      <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
        {/* Basic Information */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Name *
          </label>
          <input
            type="text"
            {...register('name', { required: 'Name is required' })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Item name"
            disabled={isSubmitting}
          />
          {errors.name && (
            <p className="text-red-500 text-sm mt-1">{errors.name.message}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Type *
          </label>
          <select
            {...register('kind', { required: 'Type is required' })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={isSubmitting}
          >
            <option value="">Select type</option>
            <option value="material">Material</option>
            <option value="object">Object</option>
            <option value="text">Text/Note</option>
          </select>
          {errors.kind && (
            <p className="text-red-500 text-sm mt-1">{errors.kind.message}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Description
          </label>
          <textarea
            {...register('description')}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Item description"
            disabled={isSubmitting}
          />
        </div>

        {/* Images */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Images
          </label>
          <input
            type="file"
            accept="image/*"
            onChange={handleImageUpload}
            disabled={isSubmitting || uploadingImage}
            className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 disabled:opacity-50"
          />
          {uploadingImage && (
            <p className="text-xs text-blue-600 mt-1">Uploading image...</p>
          )}
          
          {/* Display uploaded images */}
          {uploadedImages.length > 0 && (
            <div className="mt-3 space-y-2">
              <p className="text-xs text-gray-600">Uploaded images:</p>
              {uploadedImages.map((image, index) => (
                <div key={index} className="flex items-center space-x-2 p-2 bg-gray-50 rounded">
                  <img 
                    src={image.url} 
                    alt={image.alt || 'Uploaded image'} 
                    className="w-12 h-12 object-cover rounded"
                  />
                  <span className="text-xs text-gray-600 flex-1 truncate">
                    {image.alt || 'Image'}
                  </span>
                  <button
                    type="button"
                    onClick={() => removeImage(index)}
                    disabled={isSubmitting}
                    className="text-red-600 hover:text-red-700 text-xs px-2 py-1"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Cost Information */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Cost (USD)
          </label>
          <input
            type="number"
            step="0.01"
            {...register('cost')}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="0.00"
            disabled={isSubmitting}
          />
        </div>

        {/* Categories */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Categories
          </label>
          <select
            {...register('categories')}
            multiple
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={isSubmitting}
          >
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </div>

        {/* Tags */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Tags (comma-separated)
          </label>
          <input
            type="text"
            {...register('tags')}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="tag1, tag2, tag3"
            disabled={isSubmitting}
          />
        </div>

        {/* Dimensions */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Dimensions - Optional
          </label>
          <div className="space-y-3">
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-xs text-gray-600 mb-1">Width</label>
                <input
                  type="number"
                  step="0.01"
                  {...register('dimensions.width')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  placeholder="0"
                  disabled={isSubmitting}
                />
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-1">Height</label>
                <input
                  type="number"
                  step="0.01"
                  {...register('dimensions.height')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  placeholder="0"
                  disabled={isSubmitting}
                />
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-1">Depth</label>
                <input
                  type="number"
                  step="0.01"
                  {...register('dimensions.depth')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  placeholder="0"
                  disabled={isSubmitting}
                />
              </div>
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1">Unit</label>
              <select
                {...register('dimensions.unit')}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                disabled={isSubmitting}
              >
                <option value="">Select unit</option>
                <option value="in">Inches (in)</option>
                <option value="cm">Centimeters (cm)</option>
                <option value="mm">Millimeters (mm)</option>
                <option value="ft">Feet (ft)</option>
                <option value="m">Meters (m)</option>
                <option value="yd">Yards (yd)</option>
              </select>
            </div>
          </div>
        </div>



        {/* Form Actions */}
        <div className="flex space-x-2 pt-4">
          <button
            type="submit"
            disabled={isSubmitting}
            className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? 'Creating...' : 'Create Item'}
          </button>
          <button
            type="button"
            onClick={handleCancel}
            disabled={isSubmitting}
            className="flex-1 bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreateItemForm;
