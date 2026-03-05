import { useState } from 'react';
import { Star, Trash2, ExternalLink, X } from 'lucide-react';
import api from '../../../lib/axiosInstance';
import { toast } from 'react-toastify';

export default function ImageGallery({ images = [], onDelete, onSetFeatured, onReorder, editable = false }) {
    const [lightboxImage, setLightboxImage] = useState(null);
    const [loading, setLoading] = useState(false);

    const handleDelete = async (imageId) => {
        if (!window.confirm('Are you sure you want to delete this image?')) return;

        setLoading(true);
        try {
            await onDelete(imageId);
            toast.success('Image deleted successfully');
        } catch (error) {
            toast.error('Failed to delete image');
        } finally {
            setLoading(false);
        }
    };

    const handleSetFeatured = async (imageId) => {
        setLoading(true);
        try {
            await onSetFeatured(imageId);
            toast.success('Featured image set successfully');
        } catch (error) {
            toast.error('Failed to set featured image');
        } finally {
            setLoading(false);
        }
    };

    const getImageUrl = (image) => {
        const url = `/api/${image.file_path}`;
        //console.log('Image URL:', url, 'for image:', image);
        return url;
    };

    if (images.length === 0) {
        return (
            <div className="no-images">
                <p>No images attached</p>
            </div>
        );
    }

    return (
        <>
            <div className="image-gallery">
                <div className="gallery-grid">
                    {images.map((image) => (
                        <div key={image.id} className={`gallery-item ${image.is_featured ? 'featured' : ''}`}>
                            <div className="image-wrapper" onClick={() => setLightboxImage(image)}>
                                <img
                                    src={getImageUrl(image)}
                                    alt={image.original_filename}
                                    loading="lazy"
                                    onError={(e) => {
                                        console.error('Failed to load image:', getImageUrl(image));
                                        e.target.style.backgroundColor = '#f3f4f6';
                                        e.target.style.display = 'flex';
                                        e.target.style.alignItems = 'center';
                                        e.target.style.justifyContent = 'center';
                                        e.target.alt = '❌ Failed to load';
                                    }}
                                />
                                {image.is_featured && (
                                    <div className="featured-badge">
                                        <Star size={16} fill="currentColor" />
                                        Featured
                                    </div>
                                )}
                            </div>

                            {editable && (
                                <div className="image-actions">
                                    {!image.is_featured && (
                                        <button
                                            className="action-btn"
                                            onClick={() => handleSetFeatured(image.id)}
                                            disabled={loading}
                                            title="Set as featured"
                                        >
                                            <Star size={16} />
                                        </button>
                                    )}
                                    <button
                                        className="action-btn delete-btn"
                                        onClick={() => handleDelete(image.id)}
                                        disabled={loading}
                                        title="Delete image"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            )}

                            <div className="image-info">
                                <span className="image-name">{image.original_filename}</span>
                                <span className="image-size">
                                    {(image.file_size / 1024).toFixed(1)} KB
                                    {image.width && ` • ${image.width}×${image.height}`}
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Lightbox */}
            {lightboxImage && (
                <div className="lightbox" onClick={() => setLightboxImage(null)}>
                    <button className="lightbox-close" onClick={() => setLightboxImage(null)}>
                        <X size={24} />
                    </button>
                    <img
                        src={getImageUrl(lightboxImage)}
                        alt={lightboxImage.original_filename}
                        onClick={(e) => e.stopPropagation()}
                    />
                    <div className="lightbox-info">
                        <p>{lightboxImage.original_filename}</p>
                        <a
                            href={getImageUrl(lightboxImage)}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <ExternalLink size={16} /> Open in new tab
                        </a>
                    </div>
                </div>
            )}

            <style>{`
                .no-images {
                    text-align: center;
                    padding: 40px;
                    color: #718096;
                    background: #f7fafc;
                    border-radius: 8px;
                }

                .image-gallery {
                    margin: 20px 0;
                }

                .gallery-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
                    gap: 20px;
                }

                .gallery-item {
                    border: 2px solid #e2e8f0;
                    border-radius: 8px;
                    overflow: hidden;
                    background: white;
                    transition: all 0.3s ease;
                }

                .gallery-item.featured {
                    border-color: #f6ad55;
                    box-shadow: 0 0 0 2px rgba(246, 173, 85, 0.2);
                }

                .gallery-item:hover {
                    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
                }

                .image-wrapper {
                    position: relative;
                    cursor: pointer;
                    overflow: hidden;
                    background: #f7fafc;
                }

                .image-wrapper img {
                    width: 100%;
                    height: 200px;
                    object-fit: cover;
                    transition: transform 0.3s ease;
                }

                .image-wrapper:hover img {
                    transform: scale(1.05);
                }

                .featured-badge {
                    position: absolute;
                    top: 10px;
                    left: 10px;
                    background: #f6ad55;
                    color: white;
                    padding: 4px 8px;
                    border-radius: 4px;
                    font-size: 12px;
                    font-weight: 600;
                    display: flex;
                    align-items: center;
                    gap: 4px;
                }

                .image-actions {
                    display: flex;
                    gap: 8px;
                    padding: 8px;
                    background: #f7fafc;
                    border-top: 1px solid #e2e8f0;
                }

                .action-btn {
                    flex: 1;
                    padding: 8px;
                    border: 1px solid #cbd5e0;
                    background: white;
                    border-radius: 4px;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    transition: all 0.2s;
                }

                .action-btn:hover:not(:disabled) {
                    background: #edf2f7;
                    border-color: #a0aec0;
                }

                .action-btn:disabled {
                    opacity: 0.5;
                    cursor: not-allowed;
                }

                .delete-btn:hover:not(:disabled) {
                    background: #fed7d7;
                    border-color: #fc8181;
                    color: #c53030;
                }

                .image-info {
                    padding: 12px;
                    display: flex;
                    flex-direction: column;
                    gap: 4px;
                }

                .image-name {
                    font-size: 13px;
                    color: #2d3748;
                    font-weight: 500;
                    white-space: nowrap;
                    overflow: hidden;
                    text-overflow: ellipsis;
                }

                .image-size {
                    font-size: 11px;
                    color: #718096;
                }

                .lightbox {
                    position: fixed;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background: rgba(0, 0, 0, 0.9);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    z-index: 9999;
                    padding: 20px;
                }

                .lightbox-close {
                    position: absolute;
                    top: 20px;
                    right: 20px;
                    background: rgba(255, 255, 255, 0.1);
                    border: none;
                    color: white;
                    padding: 10px;
                    border-radius: 50%;
                    cursor: pointer;
                    transition: background 0.2s;
                }

                .lightbox-close:hover {
                    background: rgba(255, 255, 255, 0.2);
                }

                .lightbox img {
                    max-width: 90%;
                    max-height: 80vh;
                    object-fit: contain;
                    border-radius: 8px;
                }

                .lightbox-info {
                    position: absolute;
                    bottom: 20px;
                    left: 50%;
                    transform: translateX(-50%);
                    background: rgba(0, 0, 0, 0.7);
                    color: white;
                    padding: 12px 20px;
                    border-radius: 8px;
                    display: flex;
                    align-items: center;
                    gap: 20px;
                }

                .lightbox-info p {
                    margin: 0;
                    font-size: 14px;
                }

                .lightbox-info a {
                    color: #90cdf4;
                    text-decoration: none;
                    display: flex;
                    align-items: center;
                    gap: 6px;
                    font-size: 13px;
                }

                .lightbox-info a:hover {
                    color: #63b3ed;
                }
            `}</style>
        </>
    );
}
