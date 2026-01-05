import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';

const apiUrl = process.env.NEXT_PUBLIC_API_URL || '';

interface BaselineImage {
  id: string;
  name: string;
  description: string | null;
  url: string;
  ipfsHash: string | null;
  objectType: string | null;
  category: string;
  isActive: boolean;
  priority: number;
  createdAt: string;
}

const OBJECT_TYPES = [
  '', 'Star', 'Galaxy', 'Nebula', 'Black Hole', 'Pulsar', 'Quasar',
  'Star Cluster', 'Exoplanet', 'Comet', 'Asteroid', 'Supernova'
];

const CATEGORIES = [
  { value: 'style', label: 'Style Reference', description: 'Overall artistic style to match' },
  { value: 'composition', label: 'Composition', description: 'Layout and framing preferences' },
  { value: 'color', label: 'Color Palette', description: 'Color scheme preferences' },
  { value: 'reference', label: 'Scientific Reference', description: 'Accurate scientific imagery' },
];

export default function BaselineImagesAdmin() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [baselines, setBaselines] = useState<BaselineImage[]>([]);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Upload form state
  const [isUploading, setIsUploading] = useState(false);
  const [uploadName, setUploadName] = useState('');
  const [uploadDescription, setUploadDescription] = useState('');
  const [uploadObjectType, setUploadObjectType] = useState('');
  const [uploadCategory, setUploadCategory] = useState('style');
  const [uploadPriority, setUploadPriority] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadPreview, setUploadPreview] = useState<string | null>(null);

  // Selected image for preview
  const [selectedImage, setSelectedImage] = useState<BaselineImage | null>(null);

  // Handle file selection for preview
  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setUploadPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      setUploadPreview(null);
    }
  }

  useEffect(() => {
    checkAuth();
  }, []);

  async function checkAuth() {
    try {
      const token = localStorage.getItem('adminToken');
      const res = await fetch(`${apiUrl}/api/admin/me`, {
        credentials: 'include',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      if (!res.ok) {
        router.push('/admin/login');
        return;
      }

      await fetchBaselines();
    } catch (error) {
      router.push('/admin/login');
    } finally {
      setIsLoading(false);
    }
  }

  async function fetchBaselines() {
    try {
      const token = localStorage.getItem('adminToken');
      const res = await fetch(`${apiUrl}/api/admin/baseline-images`, {
        credentials: 'include',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      if (res.ok) {
        const data = await res.json();
        setBaselines(data.baselines || []);
      }
    } catch (error) {
      console.error('Failed to fetch baselines:', error);
    }
  }

  async function handleUpload(e: React.FormEvent) {
    e.preventDefault();

    const file = fileInputRef.current?.files?.[0];
    if (!file) {
      setMessage({ type: 'error', text: 'Please select an image file' });
      return;
    }

    if (!uploadName.trim()) {
      setMessage({ type: 'error', text: 'Please enter a name for the image' });
      return;
    }

    setIsUploading(true);
    setMessage(null);

    try {
      const token = localStorage.getItem('adminToken');
      const formData = new FormData();
      formData.append('image', file);
      formData.append('name', uploadName);
      formData.append('description', uploadDescription);
      formData.append('objectType', uploadObjectType);
      formData.append('category', uploadCategory);
      formData.append('priority', uploadPriority.toString());

      const res = await fetch(`${apiUrl}/api/admin/baseline-images`, {
        method: 'POST',
        credentials: 'include',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: formData,
      });

      const data = await res.json();

      if (res.ok) {
        setMessage({ type: 'success', text: 'Baseline image uploaded successfully!' });
        setUploadName('');
        setUploadDescription('');
        setUploadObjectType('');
        setUploadCategory('style');
        setUploadPriority(0);
        setUploadPreview(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
        await fetchBaselines();
      } else {
        setMessage({ type: 'error', text: data.error || 'Upload failed' });
      }
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'Upload failed' });
    } finally {
      setIsUploading(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Are you sure you want to delete this baseline image?')) return;

    try {
      const token = localStorage.getItem('adminToken');
      const res = await fetch(`${apiUrl}/api/admin/baseline-images?id=${id}`, {
        method: 'DELETE',
        credentials: 'include',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      if (res.ok) {
        setMessage({ type: 'success', text: 'Baseline image deleted' });
        await fetchBaselines();
        if (selectedImage?.id === id) setSelectedImage(null);
      } else {
        const data = await res.json();
        setMessage({ type: 'error', text: data.error || 'Delete failed' });
      }
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'Delete failed' });
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-purple-400 text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>Baseline Images | CosmoNFTs Admin</title>
      </Head>

      <div className="min-h-screen bg-gray-900 text-white">
        <nav className="bg-gray-800 border-b border-gray-700 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/admin" className="text-purple-400 hover:text-purple-300">
                &larr; Dashboard
              </Link>
              <h1 className="text-xl font-bold text-white">Baseline Images</h1>
            </div>
            <div className="text-gray-400">
              {baselines.length} image{baselines.length !== 1 ? 's' : ''} uploaded
            </div>
          </div>
        </nav>

        <div className="p-6">
          {/* Message Alert */}
          {message && (
            <div className={`mb-6 p-4 rounded-lg border ${
              message.type === 'success'
                ? 'bg-green-900/30 border-green-500 text-green-300'
                : 'bg-red-900/30 border-red-500 text-red-300'
            }`}>
              {message.text}
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Upload Form */}
            <div className="lg:col-span-1">
              <div className="bg-gray-800 rounded-lg border border-gray-700 p-6">
                <h2 className="text-lg font-semibold text-purple-400 mb-4">Upload Baseline Image</h2>
                <p className="text-gray-400 text-sm mb-4">
                  Upload images that represent your desired style. The AI will use these as reference when generating NFT images.
                </p>

                <form onSubmit={handleUpload} className="space-y-4">
                  <div>
                    <label className="block text-sm text-gray-300 mb-1">Image File *</label>
                    <input
                      type="file"
                      ref={fileInputRef}
                      accept="image/*"
                      onChange={handleFileChange}
                      className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white text-sm"
                    />
                  </div>

                  {/* Image Preview */}
                  {uploadPreview && (
                    <div className="relative">
                      <label className="block text-sm text-gray-300 mb-1">Preview</label>
                      <div className="relative rounded-lg overflow-hidden border border-gray-600">
                        <img
                          src={uploadPreview}
                          alt="Upload preview"
                          className="w-full h-48 object-contain bg-gray-900"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            setUploadPreview(null);
                            if (fileInputRef.current) fileInputRef.current.value = '';
                          }}
                          className="absolute top-2 right-2 bg-red-600 hover:bg-red-500 text-white px-2 py-1 rounded text-xs"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  )}

                  <div>
                    <label className="block text-sm text-gray-300 mb-1">Name *</label>
                    <input
                      type="text"
                      value={uploadName}
                      onChange={(e) => setUploadName(e.target.value)}
                      placeholder="e.g., Hubble Deep Field Style"
                      className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-sm text-gray-300 mb-1">Description</label>
                    <textarea
                      value={uploadDescription}
                      onChange={(e) => setUploadDescription(e.target.value)}
                      placeholder="Describe what makes this image a good reference..."
                      rows={2}
                      className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-sm text-gray-300 mb-1">Category</label>
                    <select
                      value={uploadCategory}
                      onChange={(e) => setUploadCategory(e.target.value)}
                      className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white"
                    >
                      {CATEGORIES.map(cat => (
                        <option key={cat.value} value={cat.value}>
                          {cat.label}
                        </option>
                      ))}
                    </select>
                    <p className="text-xs text-gray-500 mt-1">
                      {CATEGORIES.find(c => c.value === uploadCategory)?.description}
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm text-gray-300 mb-1">Object Type (Optional)</label>
                    <select
                      value={uploadObjectType}
                      onChange={(e) => setUploadObjectType(e.target.value)}
                      className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white"
                    >
                      <option value="">All Types</option>
                      {OBJECT_TYPES.filter(t => t).map(type => (
                        <option key={type} value={type}>{type}</option>
                      ))}
                    </select>
                    <p className="text-xs text-gray-500 mt-1">
                      Apply this baseline only to specific object types
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm text-gray-300 mb-1">Priority: {uploadPriority}</label>
                    <input
                      type="range"
                      min="0"
                      max="10"
                      value={uploadPriority}
                      onChange={(e) => setUploadPriority(parseInt(e.target.value))}
                      className="w-full"
                    />
                    <p className="text-xs text-gray-500">
                      Higher priority = more influence on generated images
                    </p>
                  </div>

                  <button
                    type="submit"
                    disabled={isUploading}
                    className="w-full bg-purple-600 hover:bg-purple-500 disabled:bg-gray-600 text-white py-2 rounded font-semibold transition-colors"
                  >
                    {isUploading ? 'Uploading...' : 'Upload Baseline Image'}
                  </button>
                </form>
              </div>
            </div>

            {/* Baseline Images Grid */}
            <div className="lg:col-span-2">
              <div className="bg-gray-800 rounded-lg border border-gray-700 p-6">
                <h2 className="text-lg font-semibold text-purple-400 mb-4">Your Baseline Images</h2>

                {baselines.length === 0 ? (
                  <div className="text-center py-12 text-gray-400">
                    <p className="mb-2">No baseline images uploaded yet.</p>
                    <p className="text-sm">Upload images that represent your desired style for NFT generation.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {baselines.map((baseline) => (
                      <div
                        key={baseline.id}
                        className={`relative group cursor-pointer rounded-lg overflow-hidden border-2 transition-all ${
                          selectedImage?.id === baseline.id
                            ? 'border-purple-500'
                            : 'border-gray-700 hover:border-gray-500'
                        }`}
                        onClick={() => setSelectedImage(baseline)}
                      >
                        <img
                          src={baseline.url}
                          alt={baseline.name}
                          className="w-full aspect-square object-cover"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                          <div className="absolute bottom-0 left-0 right-0 p-2">
                            <p className="text-white text-sm font-medium truncate">{baseline.name}</p>
                            <p className="text-gray-300 text-xs">
                              {baseline.category} {baseline.objectType && `• ${baseline.objectType}`}
                            </p>
                          </div>
                        </div>
                        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDelete(baseline.id);
                            }}
                            className="bg-red-600 hover:bg-red-500 text-white p-1 rounded text-xs"
                          >
                            Delete
                          </button>
                        </div>
                        {baseline.priority > 0 && (
                          <div className="absolute top-2 left-2">
                            <span className="bg-purple-600 text-white text-xs px-2 py-0.5 rounded">
                              P{baseline.priority}
                            </span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Selected Image Preview */}
              {selectedImage && (
                <div className="mt-6 bg-gray-800 rounded-lg border border-gray-700 p-6">
                  <div className="flex gap-6">
                    <img
                      src={selectedImage.url}
                      alt={selectedImage.name}
                      className="w-48 h-48 object-cover rounded-lg"
                    />
                    <div className="flex-1">
                      <h3 className="text-xl font-semibold text-white mb-2">{selectedImage.name}</h3>
                      {selectedImage.description && (
                        <p className="text-gray-400 text-sm mb-3">{selectedImage.description}</p>
                      )}
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-gray-500">Category:</span>
                          <span className="text-white ml-2 capitalize">{selectedImage.category}</span>
                        </div>
                        <div>
                          <span className="text-gray-500">Object Type:</span>
                          <span className="text-white ml-2">{selectedImage.objectType || 'All'}</span>
                        </div>
                        <div>
                          <span className="text-gray-500">Priority:</span>
                          <span className="text-white ml-2">{selectedImage.priority}</span>
                        </div>
                        <div>
                          <span className="text-gray-500">Uploaded:</span>
                          <span className="text-white ml-2">
                            {new Date(selectedImage.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                      {selectedImage.ipfsHash && (
                        <div className="mt-3">
                          <span className="text-gray-500 text-xs">IPFS:</span>
                          <a
                            href={selectedImage.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-purple-400 text-xs ml-2 hover:underline"
                          >
                            {selectedImage.ipfsHash.substring(0, 20)}...
                          </a>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
