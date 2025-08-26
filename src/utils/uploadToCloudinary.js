const uploadToCloudinary = async (file) => {
  const cloudName = process.env.REACT_APP_CLOUDINARY_CLOUD;
  const uploadPreset = process.env.REACT_APP_CLOUDINARY_PRESET;

  if (!cloudName || !uploadPreset) {
    throw new Error('Cloudinary configuration missing. Please set REACT_APP_CLOUDINARY_CLOUD and REACT_APP_CLOUDINARY_PRESET environment variables.');
  }

  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', uploadPreset);

  try {
    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${cloudName}/upload`,
      {
        method: 'POST',
        body: formData,
      }
    );

    if (!response.ok) {
      throw new Error(`Upload failed: ${response.status} ${response.statusText}`);
    }

    const result = await response.json();
    
    return {
      id: result.public_id,
      kind: 'image',
      url: result.secure_url,
      publicId: result.public_id,
      alt: file.name,
      width: result.width,
      height: result.height,
    };
  } catch (error) {
    console.error('Cloudinary upload error:', error);
    throw new Error(`Failed to upload image: ${error.message}`);
  }
};

export default uploadToCloudinary;
