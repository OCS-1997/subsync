import { useState, useRef } from 'react';
import { Upload, X, Image as ImageIcon } from 'lucide-react';
import api from '../../../lib/axiosInstance';
import { toast } from 'react-toastify';

export default function ImageUploader({ articleId, onUploadComplete, maxFiles = 10 }) {
    const [uploading, setUploading] = useState(false);
    const [dragActive, setDragActive] = useState(false);
    const [previews, setPreviews] = useState([]);
    const fileInputRef = useRef(null);

    const handleDrag = (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === 'dragenter' || e.type === 'dragover') {
            setDragActive(true);
        } else if (e.type === 'dragleave') {
            setDragActive(false);
        }
    };

    const handleDrop = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);

        const files = Array.from(e.dataTransfer.files);
        handleFiles(files);
    };

    const handleFileInput = (e) => {
        const files = Array.from(e.target.files);
        handleFiles(files);
    };

    const handleFiles = (files) => {
        const imageFiles = files.filter(file => file.type.startsWith('image/'));

        if (imageFiles.length === 0) {
            toast.error('Please select image files only');
            return;
        }

        if (imageFiles.length > maxFiles) {
            toast.error(`Maximum ${maxFiles} images allowed`);
            return;
        }

        // Create previews
        const newPreviews = imageFiles.map(file => ({
            file,
            preview: URL.createObjectURL(file),
            name: file.name,
            size: file.size
        }));

        setPreviews(newPreviews);
    };

    const removePreview = (index) => {
        setPreviews(prev => {
            const newPreviews = [...prev];
            URL.revokeObjectURL(newPreviews[index].preview);
            newPreviews.splice(index, 1);
            return newPreviews;
        });
    };

    const uploadImages = async () => {
        if (previews.length === 0) return;

        setUploading(true);
        try {
            const uploadPromises = previews.map(async ({ file }) => {
                const formData = new FormData();
                formData.append('image', file);

                const response = await api.post(`/kb/articles/${articleId}/images`, formData, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
                return response.data;
            });

            await Promise.all(uploadPromises);

            toast.success(`${previews.length} image(s) uploaded successfully`);
            setPreviews([]);
            if (onUploadComplete) onUploadComplete();
        } catch (error) {
            console.error('Upload error:', error);
            toast.error(error.response?.data?.error || 'Failed to upload images');
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="image-uploader">
            <div
                className={`upload-zone ${dragActive ? 'drag-active' : ''}`}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
            >
                <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handleFileInput}
                    style={{ display: 'none' }}
                />
                <Upload size={48} />
                <p>Drag & drop images here or click to browse</p>
                <span className="upload-hint">Max {maxFiles} images, 5MB each (JPEG, PNG, GIF, WebP)</span>
            </div>

            {previews.length > 0 && (
                <div className="preview-section">
                    <h4>Ready to Upload ({previews.length})</h4>
                    <div className="preview-grid">
                        {previews.map((preview, index) => (
                            <div key={index} className="preview-item">
                                <img src={preview.preview} alt={preview.name} />
                                <button
                                    className="remove-preview"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        removePreview(index);
                                    }}
                                >
                                    <X size={16} />
                                </button>
                                <div className="preview-info">
                                    <span className="preview-name">{preview.name}</span>
                                    <span className="preview-size">{(preview.size / 1024).toFixed(1)} KB</span>
                                </div>
                            </div>
                        ))}
                    </div>
                    <button
                        className="btn btn-primary upload-btn"
                        onClick={uploadImages}
                        disabled={uploading}
                    >
                        {uploading ? 'Uploading...' : `Upload ${previews.length} Image(s)`}
                    </button>
                </div>
            )}

            <style>{`
                .image-uploader {
                    margin: 20px 0;
                }

                .upload-zone {
                    border: 2px dashed #cbd5e0;
                    border-radius: 8px;
                    padding: 40px 20px;
                    text-align: center;
                    cursor: pointer;
                    transition: all 0.3s ease;
                    background: #f7fafc;
                }

                .upload-zone:hover, .upload-zone.drag-active {
                    border-color: #4299e1;
                    background: #ebf8ff;
                }

                .upload-zone svg {
                    color: #4299e1;
                    margin-bottom: 10px;
                }

                .upload-zone p {
                    font-size: 16px;
                    color: #2d3748;
                    margin: 10px 0 5px;
                }

                .upload-hint {
                    font-size: 12px;
                    color: #718096;
                }

                .preview-section {
                    margin-top: 20px;
                }

                .preview-section h4 {
                    margin-bottom: 15px;
                    color: #2d3748;
                }

                .preview-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
                    gap: 15px;
                    margin-bottom: 20px;
                }

                .preview-item {
                    position: relative;
                    border: 1px solid #e2e8f0;
                    border-radius: 8px;
                    overflow: hidden;
                    background: white;
                }

                .preview-item img {
                    width: 100%;
                    height: 150px;
                    object-fit: cover;
                }

                .remove-preview {
                    position: absolute;
                    top: 5px;
                    right: 5px;
                    background: rgba(0, 0, 0, 0.6);
                    color: white;
                    border: none;
                    border-radius: 50%;
                    width: 24px;
                    height: 24px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    cursor: pointer;
                    transition: background 0.2s;
                }

                .remove-preview:hover {
                    background: rgba(0, 0, 0, 0.8);
                }

                .preview-info {
                    padding: 8px;
                    display: flex;
                    flex-direction: column;
                    gap: 4px;
                }

                .preview-name {
                    font-size: 12px;
                    color: #2d3748;
                    white-space: nowrap;
                    overflow: hidden;
                    text-overflow: ellipsis;
                }

                .preview-size {
                    font-size: 11px;
                    color: #718096;
                }

                .upload-btn {
                    width: 100%;
                    padding: 12px;
                    font-size: 16px;
                }

                .upload-btn:disabled {
                    opacity: 0.6;
                    cursor: not-allowed;
                }
            `}</style>
        </div>
    );
}
