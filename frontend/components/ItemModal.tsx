'use client';

import { useState, useEffect } from 'react';
import { ItemType, VaultItem, WebsiteLogin, Card, SecureNote } from '@passx/shared';
import { calculatePasswordStrength } from '@passx/shared';
import { X, Globe, CreditCard, FileText, Eye, EyeOff, Key, Plus, Tag, Folder, Save } from 'lucide-react';
import PasswordGenerator from './PasswordGenerator';

interface ItemModalProps {
  item: VaultItem | null;
  decryptedData?: WebsiteLogin | Card | SecureNote | null;
  onClose: () => void;
  onSave: (
    type: ItemType,
    name: string,
    data: WebsiteLogin | Card | SecureNote,
    tags?: string[],
    category?: string
  ) => Promise<void>;
}

export default function ItemModal({ item, decryptedData, onClose, onSave }: ItemModalProps) {
  const [type, setType] = useState<ItemType>(item?.type || ItemType.WEBSITE);
  const [name, setName] = useState(item?.name || '');
  const [category, setCategory] = useState(item?.category || '');
  const [tags, setTags] = useState(item?.tags?.join(', ') || '');
  const [showPasswordGenerator, setShowPasswordGenerator] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(0);

  // Website fields
  const [url, setUrl] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [notes, setNotes] = useState('');

  // Card fields
  const [cardholderName, setCardholderName] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [expiryMonth, setExpiryMonth] = useState('');
  const [expiryYear, setExpiryYear] = useState('');
  const [bankName, setBankName] = useState('');

  // Note fields
  const [noteTitle, setNoteTitle] = useState('');
  const [noteContent, setNoteContent] = useState('');

  const [loading, setLoading] = useState(false);
  const [tagInput, setTagInput] = useState('');
  const [tagList, setTagList] = useState<string[]>([]);

  useEffect(() => {
    if (item) {
      setName(item.name);
      setCategory(item.category || '');
      const itemTags = item.tags || [];
      setTags(itemTags.join(', '));
      setTagList(itemTags);
      setType(item.type);

      // Populate fields with decrypted data if editing
      if (decryptedData) {
        if (item.type === ItemType.WEBSITE) {
          const login = decryptedData as WebsiteLogin;
          setUrl(login.url || '');
          setUsername(login.username || '');
          setPassword(login.password || '');
          setNotes(login.notes || '');
        } else if (item.type === ItemType.CARD) {
          const card = decryptedData as Card;
          setCardholderName(card.cardholderName || '');
          setCardNumber(card.cardNumber || '');
          setExpiryMonth(card.expiryMonth || '');
          setExpiryYear(card.expiryYear || '');
          setBankName(card.bankName || '');
        } else if (item.type === ItemType.NOTE) {
          const note = decryptedData as SecureNote;
          setNoteTitle(note.title || '');
          setNoteContent(note.content || '');
        }
      } else {
        // Reset fields if not editing or no decrypted data
        setUrl('');
        setUsername('');
        setPassword('');
        setNotes('');
        setCardholderName('');
        setCardNumber('');
        setExpiryMonth('');
        setExpiryYear('');
        setBankName('');
        setNoteTitle('');
        setNoteContent('');
      }
    } else {
      // Reset all fields when creating new item
      setName('');
      setCategory('');
      setTags('');
      setTagList([]);
      setUrl('');
      setUsername('');
      setPassword('');
      setNotes('');
      setCardholderName('');
      setCardNumber('');
      setExpiryMonth('');
      setExpiryYear('');
      setBankName('');
      setNoteTitle('');
      setNoteContent('');
    }
  }, [item, decryptedData]);

  useEffect(() => {
    if (tags) {
      setTagList(tags.split(',').map(t => t.trim()).filter(t => t.length > 0));
    }
  }, [tags]);

  // Calculate password strength when password changes
  useEffect(() => {
    if (password && type === ItemType.WEBSITE) {
      const strength = calculatePasswordStrength(password);
      setPasswordStrength(strength);
    } else {
      setPasswordStrength(0);
    }
  }, [password, type]);

  const addTag = () => {
    if (tagInput.trim() && !tagList.includes(tagInput.trim())) {
      const newTags = [...tagList, tagInput.trim()];
      setTagList(newTags);
      setTags(newTags.join(', '));
      setTagInput('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    const newTags = tagList.filter(t => t !== tagToRemove);
    setTagList(newTags);
    setTags(newTags.join(', '));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      let data: WebsiteLogin | Card | SecureNote;

      if (type === ItemType.WEBSITE) {
        data = {
          url,
          username,
          password,
          notes: notes || undefined,
        } as WebsiteLogin;
      } else if (type === ItemType.CARD) {
        data = {
          cardholderName,
          cardNumber,
          expiryMonth,
          expiryYear,
          bankName: bankName || undefined,
        } as Card;
      } else {
        data = {
          title: noteTitle,
          content: noteContent,
        } as SecureNote;
      }

      await onSave(type, name, data, tagList, category || undefined);
      onClose();
    } catch (err) {
      console.error('Error saving item:', err);
      alert('Failed to save item');
    } finally {
      setLoading(false);
    }
  };

  const typeOptions = [
    { value: ItemType.WEBSITE, label: 'Website', icon: Globe, color: 'from-blue-500 to-blue-600' },
    { value: ItemType.CARD, label: 'Card', icon: CreditCard, color: 'from-purple-500 to-purple-600' },
    { value: ItemType.NOTE, label: 'Note', icon: FileText, color: 'from-green-500 to-green-600' },
  ];

  return (
    <>
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in overflow-y-auto">
        <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl max-w-2xl w-full relative overflow-hidden border border-gray-200 dark:border-gray-700 animate-slide-up my-8">
          {/* Decorative gradient background */}
          <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500"></div>

          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-all duration-200 z-10"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="p-8">
            {/* Header */}
            <div className="mb-6">
              <div className="flex items-center gap-3 mb-2">
                {(() => {
                  const selectedType = typeOptions.find(t => t.value === type);
                  const Icon = selectedType?.icon || Globe;
                  return (
                    <div className={`w-12 h-12 bg-gradient-to-br ${selectedType?.color || 'from-blue-500 to-purple-600'} rounded-xl flex items-center justify-center`}>
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                  );
                })()}
                <h2 className="text-3xl font-bold text-gray-900 dark:text-white font-science-gothic">
                  {item ? 'Edit Item' : 'Add New Item'}
                </h2>
              </div>
              <p className="text-gray-500 dark:text-gray-400 text-sm">
                {item ? 'Update your vault item' : 'Create a new secure entry'}
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Type Selection */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
                  <Key className="w-4 h-4" />
                  Item Type
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {typeOptions.map((option) => {
                    const Icon = option.icon;
                    const isSelected = type === option.value;
                    return (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => setType(option.value)}
                        disabled={!!item}
                        className={`p-4 rounded-xl border-2 transition-all duration-300 ${
                          isSelected
                            ? `border-primary-500 bg-gradient-to-br ${option.color} text-white shadow-lg scale-105`
                            : 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50 text-gray-700 dark:text-gray-300 hover:border-primary-300 dark:hover:border-primary-600 hover:scale-102'
                        } ${item ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                      >
                        <Icon className={`w-6 h-6 mx-auto mb-2 ${isSelected ? 'text-white' : ''}`} />
                        <div className={`text-sm font-semibold ${isSelected ? 'text-white' : ''}`}>
                          {option.label}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Name Field */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="input-field"
                  placeholder="e.g., Gmail, Bank Account, Secure Note"
                />
              </div>

              {/* Website Fields */}
              {type === ItemType.WEBSITE && (
                <div className="space-y-4 animate-fade-in">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                      URL <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="url"
                      value={url}
                      onChange={(e) => setUrl(e.target.value)}
                      required
                      className="input-field"
                      placeholder="https://example.com"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                      Username/Email <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      required
                      className="input-field"
                      placeholder="your.email@example.com"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                      Password <span className="text-red-500">*</span>
                    </label>
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <input
                          type={showPassword ? 'text' : 'password'}
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          required
                          className="input-field pr-10"
                          placeholder="Enter password"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                        >
                          {showPassword ? (
                            <EyeOff className="w-5 h-5" />
                          ) : (
                            <Eye className="w-5 h-5" />
                          )}
                        </button>
                      </div>
                      <button
                        type="button"
                        onClick={() => setShowPasswordGenerator(true)}
                        className="px-4 py-2 bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 text-white font-semibold rounded-xl transition-all duration-300 hover:shadow-lg hover:scale-105 flex items-center gap-2"
                      >
                        <Key className="w-4 h-4" />
                        Generate
                      </button>
                    </div>
                    {/* Password Strength Indicator */}
                    {password && (
                      <div className="mt-2 flex items-center gap-3">
                        <div className="flex-1">
                          <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                            <div
                              className={`h-full transition-all duration-300 ${
                                passwordStrength < 40
                                  ? 'bg-red-500'
                                  : passwordStrength < 70
                                  ? 'bg-yellow-500'
                                  : 'bg-green-500'
                              }`}
                              style={{ width: `${passwordStrength}%` }}
                            />
                          </div>
                        </div>
                        <span
                          className={`text-xs font-semibold whitespace-nowrap ${
                            passwordStrength < 40
                              ? 'text-red-600 dark:text-red-400'
                              : passwordStrength < 70
                              ? 'text-yellow-600 dark:text-yellow-400'
                              : 'text-green-600 dark:text-green-400'
                          }`}
                        >
                          {passwordStrength < 40
                            ? 'Weak'
                            : passwordStrength < 70
                            ? 'Medium'
                            : 'Strong'}
                        </span>
                      </div>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                      Notes
                    </label>
                    <textarea
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      className="input-field resize-none"
                      rows={3}
                      placeholder="Additional notes or information..."
                    />
                  </div>
                </div>
              )}

              {/* Card Fields */}
              {type === ItemType.CARD && (
                <div className="space-y-4 animate-fade-in">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                      Cardholder Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={cardholderName}
                      onChange={(e) => setCardholderName(e.target.value)}
                      required
                      className="input-field"
                      placeholder="John Doe"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                      Card Number <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={cardNumber}
                      onChange={(e) => setCardNumber(e.target.value.replace(/\D/g, '').slice(0, 16))}
                      required
                      maxLength={16}
                      className="input-field font-mono"
                      placeholder="1234 5678 9012 3456"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                        Expiry Month <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={expiryMonth}
                        onChange={(e) => setExpiryMonth(e.target.value.replace(/\D/g, '').slice(0, 2))}
                        required
                        maxLength={2}
                        className="input-field"
                        placeholder="MM"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                        Expiry Year <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={expiryYear}
                        onChange={(e) => setExpiryYear(e.target.value.replace(/\D/g, '').slice(0, 4))}
                        required
                        maxLength={4}
                        className="input-field"
                        placeholder="YYYY"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                      Bank Name
                    </label>
                    <input
                      type="text"
                      value={bankName}
                      onChange={(e) => setBankName(e.target.value)}
                      className="input-field"
                      placeholder="e.g., Chase, Bank of America"
                    />
                  </div>
                </div>
              )}

              {/* Note Fields */}
              {type === ItemType.NOTE && (
                <div className="space-y-4 animate-fade-in">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                      Title <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={noteTitle}
                      onChange={(e) => setNoteTitle(e.target.value)}
                      required
                      className="input-field"
                      placeholder="Note title"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                      Content <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      value={noteContent}
                      onChange={(e) => setNoteContent(e.target.value)}
                      required
                      className="input-field resize-none"
                      rows={6}
                      placeholder="Enter your secure note content..."
                    />
                  </div>
                </div>
              )}

              {/* Category */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
                  <Folder className="w-4 h-4" />
                  Category
                </label>
                <input
                  type="text"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="input-field"
                  placeholder="e.g., Work, Personal, Finance"
                />
              </div>

              {/* Tags */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
                  <Tag className="w-4 h-4" />
                  Tags
                </label>
                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        addTag();
                      }
                    }}
                    className="input-field flex-1"
                    placeholder="Add a tag and press Enter"
                  />
                  <button
                    type="button"
                    onClick={addTag}
                    className="px-4 py-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 font-semibold rounded-xl transition-all duration-200 hover:scale-105 flex items-center gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    Add
                  </button>
                </div>
                {tagList.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {tagList.map((tag) => (
                      <span
                        key={tag}
                        className="inline-flex items-center gap-2 px-3 py-1 bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 rounded-lg text-sm font-medium"
                      >
                        {tag}
                        <button
                          type="button"
                          onClick={() => removeTag(tag)}
                          className="hover:text-primary-900 dark:hover:text-primary-100 transition-colors"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-900 dark:text-white font-semibold py-3 px-6 rounded-xl transition-all duration-300 hover:shadow-md hover:scale-[1.02]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 text-white font-semibold py-3 px-6 rounded-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 hover:shadow-lg hover:scale-[1.02]"
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="w-5 h-5" />
                      {item ? 'Update Item' : 'Save Item'}
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

      {showPasswordGenerator && (
        <PasswordGenerator
          onClose={() => setShowPasswordGenerator(false)}
          onUsePassword={(pwd) => {
            setPassword(pwd);
            setShowPasswordGenerator(false);
          }}
        />
      )}
    </>
  );
}
