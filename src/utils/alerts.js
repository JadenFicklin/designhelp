import Swal from 'sweetalert2';

// Success alerts
export const showSuccess = (title, message = '') => {
  return Swal.fire({
    icon: 'success',
    title,
    text: message,
    timer: 2000,
    showConfirmButton: false,
  });
};

// Error alerts
export const showError = (title, message = '') => {
  return Swal.fire({
    icon: 'error',
    title,
    text: message,
  });
};

// Warning alerts
export const showWarning = (title, message = '') => {
  return Swal.fire({
    icon: 'warning',
    title,
    text: message,
  });
};

// Info alerts
export const showInfo = (title, message = '') => {
  return Swal.fire({
    icon: 'info',
    title,
    text: message,
  });
};

// Confirmation dialogs
export const showConfirm = (title, message = '', confirmText = 'Yes', cancelText = 'Cancel') => {
  return Swal.fire({
    icon: 'question',
    title,
    text: message,
    showCancelButton: true,
    confirmButtonText: confirmText,
    cancelButtonText: cancelText,
    reverseButtons: true,
  });
};

// Loading alerts
export const showLoading = (title = 'Loading...') => {
  return Swal.fire({
    title,
    allowOutsideClick: false,
    didOpen: () => {
      Swal.showLoading();
    },
  });
};

// Close any open alert
export const closeAlert = () => {
  Swal.close();
};

// Item-specific alerts
export const showItemCreated = () => {
  return showSuccess('Item Created!', 'Your new item has been added to the library.');
};

export const showItemUpdated = () => {
  return showSuccess('Item Updated!', 'Your item has been successfully updated.');
};

export const showItemDeleted = () => {
  return showSuccess('Item Deleted!', 'The item has been removed from the library.');
};

export const showCategoryCreated = () => {
  return showSuccess('Category Created!', 'Your new category has been added.');
};

export const showCategoryUpdated = () => {
  return showSuccess('Category Updated!', 'Your category has been successfully updated.');
};

export const showCategoryDeleted = () => {
  return showSuccess('Category Deleted!', 'The category has been removed.');
};

export const showImportSuccess = (count) => {
  return showSuccess('Import Successful!', `Successfully imported ${count} items.`);
};

export const showExportSuccess = () => {
  return showSuccess('Export Successful!', 'Your data has been exported successfully.');
};

export const showUploadSuccess = () => {
  return showSuccess('Upload Successful!', 'Your image has been uploaded successfully.');
};

// Error-specific alerts
export const showCreateItemError = (error) => {
  return showError('Failed to Create Item', error.message || 'Please try again.');
};

export const showUpdateItemError = (error) => {
  return showError('Failed to Update Item', error.message || 'Please try again.');
};

export const showDeleteItemError = (error) => {
  return showError('Failed to Delete Item', error.message || 'Please try again.');
};

export const showCategoryError = (error) => {
  return showError('Category Error', error.message || 'Please try again.');
};

export const showImportError = (error) => {
  return showError('Import Failed', error.message || 'Please check your file format and try again.');
};

export const showExportError = (error) => {
  return showError('Export Failed', error.message || 'Please try again.');
};

export const showUploadError = (error) => {
  return showError('Upload Failed', error.message || 'Please try again.');
};

// Confirmation dialogs
export const confirmDeleteItem = (itemName) => {
  return showConfirm(
    'Delete Item',
    `Are you sure you want to delete "${itemName}"? This action cannot be undone.`,
    'Delete',
    'Cancel'
  );
};

export const confirmDeleteCategory = (categoryName) => {
  return showConfirm(
    'Delete Category',
    `Are you sure you want to delete "${categoryName}"? This action cannot be undone.`,
    'Delete',
    'Cancel'
  );
};

export const confirmImport = () => {
  return showConfirm(
    'Import Data',
    'This will replace all existing items. Are you sure you want to continue?',
    'Import',
    'Cancel'
  );
};
