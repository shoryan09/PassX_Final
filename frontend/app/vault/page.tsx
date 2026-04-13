'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Layout from '@/components/Layout';
import { useVault } from '@/hooks/useVault';
import { ItemType, VaultItem, WebsiteLogin, Card, SecureNote } from '@passx/shared';
import { Eye, EyeOff, Copy, Plus, Trash2, Edit, ExternalLink, Globe, X } from 'lucide-react';
import PasswordGenerator from '@/components/PasswordGenerator';
import ItemModal from '@/components/ItemModal';
import ProtectedRoute from '@/components/ProtectedRoute';
import InteractiveBackground from '@/components/InteractiveBackground';

function VaultContent() {
  const searchParams = useSearchParams();
  const [masterPassword, setMasterPassword] = useState<string | null>(
    typeof window !== 'undefined' ? sessionStorage.getItem('masterPassword') : null
  );
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showItemModal, setShowItemModal] = useState(false);
  const [editingItem, setEditingItem] = useState<VaultItem | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<ItemType | 'all'>('all');
  const [visiblePasswords, setVisiblePasswords] = useState<Set<string>>(new Set());
  const [decryptedData, setDecryptedData] = useState<Map<string, any>>(new Map());
  const [viewingItem, setViewingItem] = useState<VaultItem | null>(null);
  const [copiedMessage, setCopiedMessage] = useState<string | null>(null);

  const { items, loading, decryptItem, createItem, updateItem, deleteItem } = useVault(
    masterPassword
  );

  useEffect(() => {
    if (searchParams?.get('action') === 'new') {
      setShowItemModal(true);
    }
  }, [searchParams]);

  useEffect(() => {
    if (typeof window !== 'undefined' && !masterPassword) {
      const password = prompt('Enter your master password:');
      if (password) {
        setMasterPassword(password);
        sessionStorage.setItem('masterPassword', password);
      }
    }
  }, [masterPassword]);

  useEffect(() => {
    const loadDecryptedData = async () => {
      if (!masterPassword || items.length === 0) return;
      
      // Decrypt all items in parallel for better performance
      const decryptionPromises = items.map(async (item) => {
        const decrypted = await decryptItem(item);
        return decrypted ? [item.id, decrypted] : null;
      });
      
      const results = await Promise.all(decryptionPromises);
      const newMap = new Map();
      
      results.forEach((result) => {
        if (result) {
          newMap.set(result[0], result[1]);
        }
      });
      
      setDecryptedData(newMap);
    };

    loadDecryptedData();
  }, [items, masterPassword, decryptItem]);

  const filteredItems = items.filter((item) => {
    if (selectedType !== 'all' && item.type !== selectedType) return false;
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        item.name.toLowerCase().includes(query) ||
        item.category?.toLowerCase().includes(query) ||
        item.tags?.some((tag) => tag.toLowerCase().includes(query)) || false
      );
    }
    return true;
  });

  const togglePasswordVisibility = (itemId: string) => {
    setVisiblePasswords((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(itemId)) {
        newSet.delete(itemId);
      } else {
        newSet.add(itemId);
      }
      return newSet;
    });
  };

  const copyToClipboard = (text: string, label: string = 'Password') => {
    navigator.clipboard.writeText(text);
    setCopiedMessage(`${label} copied!`);
    setTimeout(() => {
      setCopiedMessage(null);
    }, 2000);
  };

  const handleSave = async (
    type: ItemType,
    name: string,
    data: WebsiteLogin | Card | SecureNote,
    tags?: string[],
    category?: string
  ) => {
    if (editingItem) {
      await updateItem(editingItem.id, { name, data, tags, category });
      setEditingItem(null);
    } else {
      await createItem(type, name, data, tags, category);
    }
    setShowItemModal(false);
  };

  if (!masterPassword) {
    return (
      <Layout>
        <div className="card text-center">
          <p className="text-gray-600 dark:text-gray-300">Please enter your master password to continue.</p>
        </div>
      </Layout>
    );
  }

  return (
    <>
      <InteractiveBackground />
      <Layout>
        <div className="space-y-6 font-urbanist relative z-10">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Vault</h1>
          <div className="flex gap-2">
            <button
              onClick={() => setShowPasswordModal(true)}
              className="btn-secondary flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Generate Password
            </button>
            <button
              onClick={() => {
                setEditingItem(null);
                setShowItemModal(true);
              }}
              className="btn-primary flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Add Item
            </button>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search by name, category, or tag..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-4 py-3 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border border-gray-200/50 dark:border-gray-700/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500/50 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 transition-all shadow-sm hover:shadow-md"
            />
          </div>
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value as ItemType | 'all')}
            className="px-4 py-3 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border border-gray-200/50 dark:border-gray-700/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500/50 text-gray-900 dark:text-white transition-all shadow-sm hover:shadow-md"
          >
            <option value="all">All Types</option>
            <option value={ItemType.WEBSITE}>Websites</option>
            <option value={ItemType.CARD}>Cards</option>
            <option value={ItemType.NOTE}>Notes</option>
          </select>
        </div>

        {loading ? (
          <div className="card text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          </div>
        ) : filteredItems.length === 0 && items.length === 0 ? (
          <div className="card text-center py-12 min-h-[400px] flex items-center justify-center">
            <p className="text-gray-600 dark:text-gray-400">No items found. Create your first entry!</p>
          </div>
        ) : (
          <div className="card overflow-hidden p-0">
            <div className="overflow-x-auto">
              <table className="w-full table-fixed">
                <thead className="bg-gray-50 dark:bg-gray-700/50 border-b border-gray-200 dark:border-gray-700">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider w-[20%]">
                      Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider w-[30%]">
                      Website/Link
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider w-[15%]">
                      Type
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider w-[15%]">
                      Category
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider w-[20%]">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {filteredItems.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-12 text-center">
                        <p className="text-gray-600 dark:text-gray-400">No items found matching your search.</p>
                      </td>
                    </tr>
                  ) : (
                    filteredItems.map((item) => {
                      const decrypted = decryptedData.get(item.id);
                      const websiteUrl = decrypted && item.type === ItemType.WEBSITE 
                        ? (decrypted as WebsiteLogin).url 
                        : null;
                      
                      return (
                        <tr 
                          key={item.id} 
                          className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                        >
                          <td className="px-6 py-4 w-[20%]">
                            <div className="flex items-center gap-2">
                              {item.type === ItemType.WEBSITE && (
                                <Globe className="w-4 h-4 text-primary-600 dark:text-primary-400 flex-shrink-0" />
                              )}
                              <span className="text-sm font-medium text-gray-900 dark:text-white truncate">
                                {item.name}
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4 w-[30%]">
                            {websiteUrl ? (
                              <a
                                href={websiteUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-sm text-primary-600 dark:text-primary-400 hover:text-primary-800 dark:hover:text-primary-300 flex items-center gap-1 hover:underline"
                              >
                                <span className="truncate">{websiteUrl}</span>
                                <ExternalLink className="w-3 h-3 flex-shrink-0" />
                              </a>
                            ) : (
                              <span className="text-sm text-gray-400 dark:text-gray-500">
                                {item.type === ItemType.CARD ? 'Card' : item.type === ItemType.NOTE ? 'Note' : '—'}
                              </span>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap w-[15%]">
                            <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300">
                              {item.type}
                            </span>
                          </td>
                          <td className="px-6 py-4 w-[15%]">
                            <span className="text-sm text-gray-600 dark:text-gray-300 truncate block">
                              {item.category || '—'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-center w-[20%]">
                            <div className="flex items-center justify-center gap-2">
                              <button
                                onClick={() => setViewingItem(item)}
                                className="px-3 py-1.5 text-xs font-medium text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-900/20 hover:bg-primary-100 dark:hover:bg-primary-900/30 rounded-lg transition-colors"
                              >
                                View Details
                              </button>
                              <button
                                onClick={async () => {
                                  setEditingItem(item);
                                  // Decrypt the item before opening modal
                                  if (masterPassword) {
                                    const decrypted = await decryptItem(item);
                                    if (decrypted) {
                                      setDecryptedData(prev => {
                                        const newMap = new Map(prev);
                                        newMap.set(item.id, decrypted);
                                        return newMap;
                                      });
                                    }
                                  }
                                  setShowItemModal(true);
                                }}
                                className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                                title="Edit"
                              >
                                <Edit className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => deleteItem(item.id)}
                                className="p-1.5 text-red-400 hover:text-red-600 dark:hover:text-red-500 transition-colors"
                                title="Delete"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {showPasswordModal && (
        <PasswordGenerator
          onClose={() => setShowPasswordModal(false)}
          onUsePassword={(password) => {
            setShowPasswordModal(false);
          }}
        />
      )}

      {showItemModal && (
        <ItemModal
          item={editingItem}
          decryptedData={editingItem ? decryptedData.get(editingItem.id) || null : null}
          onClose={() => {
            setShowItemModal(false);
            setEditingItem(null);
          }}
          onSave={handleSave}
        />
      )}

      {/* Item Details Modal */}
      {viewingItem && (
        <ItemDetailsModal
          item={viewingItem}
          decryptedData={decryptedData.get(viewingItem.id)}
          visiblePasswords={visiblePasswords}
          onClose={() => setViewingItem(null)}
          onTogglePassword={() => togglePasswordVisibility(viewingItem.id)}
          onCopy={copyToClipboard}
        />
      )}

      {/* Toast Notification */}
      {copiedMessage && (
        <div className="fixed bottom-6 right-6 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg flex items-center gap-2 z-50 animate-slide-up">
          <Copy className="w-4 h-4" />
          <span className="font-medium">{copiedMessage}</span>
        </div>
      )}
      </Layout>
    </>
  );
}

// Item Details Modal Component
function ItemDetailsModal({
  item,
  decryptedData,
  visiblePasswords,
  onClose,
  onTogglePassword,
  onCopy,
}: {
  item: VaultItem;
  decryptedData: any;
  visiblePasswords: Set<string>;
  onClose: () => void;
  onTogglePassword: () => void;
  onCopy: (text: string, label?: string) => void;
}) {
  const isPasswordVisible = visiblePasswords.has(item.id);

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-2xl w-full relative border border-gray-200 dark:border-gray-700 animate-slide-up">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-all duration-200 z-10"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="p-6">
          {/* Header */}
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white font-science-gothic mb-2">
              {item.name}
            </h2>
            <div className="flex items-center gap-2">
              <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300">
                {item.type}
              </span>
              {item.category && (
                <span className="px-2 py-1 text-xs font-medium rounded-full bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300">
                  {item.category}
                </span>
              )}
            </div>
          </div>

          {/* Content */}
          {decryptedData && (
            <div className="space-y-4">
              {item.type === ItemType.WEBSITE && (
                <>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1 uppercase">
                      Website URL
                    </label>
                    <div className="flex items-center gap-2 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                      <a
                        href={(decryptedData as WebsiteLogin).url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-primary-600 dark:text-primary-400 hover:underline flex-1 truncate"
                      >
                        {(decryptedData as WebsiteLogin).url}
                      </a>
                      <button
                        onClick={() => onCopy((decryptedData as WebsiteLogin).url, 'URL')}
                        className="p-1.5 text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
                        title="Copy URL"
                      >
                        <Copy className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1 uppercase">
                      Username/Email
                    </label>
                    <div className="flex items-center gap-2 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                      <span className="text-sm text-gray-900 dark:text-white flex-1">
                        {(decryptedData as WebsiteLogin).username}
                      </span>
                      <button
                        onClick={() => onCopy((decryptedData as WebsiteLogin).username, 'Username')}
                        className="p-1.5 text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
                        title="Copy Username"
                      >
                        <Copy className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1 uppercase">
                      Password
                    </label>
                    <div className="flex items-center gap-2 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                      <span className="text-sm text-gray-900 dark:text-white font-mono flex-1 min-h-[20px]">
                        {isPasswordVisible
                          ? (decryptedData as WebsiteLogin).password
                          : '•'.repeat((decryptedData as WebsiteLogin).password.length || 20)}
                      </span>
                      <button
                        onClick={onTogglePassword}
                        className="p-1.5 text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
                        title={isPasswordVisible ? 'Hide Password' : 'Show Password'}
                      >
                        {isPasswordVisible ? (
                          <EyeOff className="w-4 h-4" />
                        ) : (
                          <Eye className="w-4 h-4" />
                        )}
                      </button>
                      <button
                        onClick={() => onCopy((decryptedData as WebsiteLogin).password, 'Password')}
                        className="p-1.5 text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
                        title="Copy Password"
                      >
                        <Copy className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  {(decryptedData as WebsiteLogin).notes && (
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1 uppercase">
                        Notes
                      </label>
                      <div className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                        <p className="text-sm text-gray-900 dark:text-white whitespace-pre-wrap">
                          {(decryptedData as WebsiteLogin).notes}
                        </p>
                      </div>
                    </div>
                  )}
                </>
              )}

              {item.type === ItemType.CARD && (
                <>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1 uppercase">
                      Card Number
                    </label>
                    <div className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                      <p className="text-sm text-gray-900 dark:text-white font-mono">
                        **** **** **** {(decryptedData as Card).cardNumber.slice(-4)}
                      </p>
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1 uppercase">
                      Cardholder Name
                    </label>
                    <div className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                      <p className="text-sm text-gray-900 dark:text-white">
                        {(decryptedData as Card).cardholderName}
                      </p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1 uppercase">
                        Expiry
                      </label>
                      <div className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                        <p className="text-sm text-gray-900 dark:text-white">
                          {(decryptedData as Card).expiryMonth}/{(decryptedData as Card).expiryYear}
                        </p>
                      </div>
                    </div>
                    {decryptedData.bankName && (
                      <div>
                        <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1 uppercase">
                          Bank Name
                        </label>
                        <div className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                          <p className="text-sm text-gray-900 dark:text-white">
                            {decryptedData.bankName}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </>
              )}

              {item.type === ItemType.NOTE && (
                <>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1 uppercase">
                      Title
                    </label>
                    <div className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {(decryptedData as SecureNote).title}
                      </p>
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1 uppercase">
                      Content
                    </label>
                    <div className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                      <p className="text-sm text-gray-900 dark:text-white whitespace-pre-wrap">
                        {(decryptedData as SecureNote).content}
                      </p>
                    </div>
                  </div>
                </>
              )}

              {/* Tags */}
              {item.tags && item.tags.length > 0 && (
                <div>
                  <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-2 uppercase">
                    Tags
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {item.tags.map((tag) => (
                      <span
                        key={tag}
                        className="px-3 py-1 bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 text-sm rounded-lg"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function VaultPage() {
  return (
    <ProtectedRoute>
      <Suspense fallback={
        <div className="flex items-center justify-center min-h-screen bg-white dark:bg-gray-900">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 dark:border-primary-400"></div>
        </div>
      }>
        <VaultContent />
      </Suspense>
    </ProtectedRoute>
  );
}

