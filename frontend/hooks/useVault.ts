'use client';

import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { VaultItem, ItemType, WebsiteLogin, Card, SecureNote } from '@passx/shared';
import { encrypt, decrypt, generateSalt } from '@passx/shared';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

export function useVault(masterPassword: string | null) {
  const [items, setItems] = useState<VaultItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchItems = useCallback(async () => {
    if (!masterPassword) return;

    try {
      setLoading(true);
      const response = await axios.get(`${API_URL}/vault/items`);
      // Normalize dates from strings to Date objects
      const normalizedItems = response.data.map((item: any) => ({
        ...item,
        createdAt: item.createdAt ? new Date(item.createdAt) : new Date(),
        updatedAt: item.updatedAt ? new Date(item.updatedAt) : new Date(),
        lastAccessed: item.lastAccessed ? new Date(item.lastAccessed) : undefined,
      }));
      setItems(normalizedItems);
      setError(null);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to fetch items');
    } finally {
      setLoading(false);
    }
  }, [masterPassword]);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  const decryptItem = useCallback(async (item: VaultItem): Promise<WebsiteLogin | Card | SecureNote | null> => {
    if (!masterPassword) return null;

    try {
      const decrypted = await decrypt(
        item.encryptedData,
        item.iv,
        item.salt || '',
        masterPassword
      );
      return JSON.parse(decrypted);
    } catch (err) {
      console.error('Decryption failed:', err);
      return null;
    }
  }, [masterPassword]);

  const createItem = async (
    type: ItemType,
    name: string,
    data: WebsiteLogin | Card | SecureNote,
    tags?: string[],
    category?: string
  ) => {
    if (!masterPassword) throw new Error('Master password required');

    const salt = generateSalt();
    const plaintext = JSON.stringify(data);
    const { encrypted, iv, salt: saltBase64 } = await encrypt(plaintext, masterPassword, salt);

    const response = await axios.post(`${API_URL}/vault/items`, {
      type,
      name,
      encryptedData: encrypted,
      iv,
      salt: saltBase64,
      tags,
      category,
    });

    setItems((prev) => [...prev, response.data]);
    return response.data;
  };

  const updateItem = async (
    id: string,
    updates: Partial<{
      name: string;
      data: WebsiteLogin | Card | SecureNote;
      tags: string[];
      category: string;
    }>
  ) => {
    if (!masterPassword) throw new Error('Master password required');

    const item = items.find((i) => i.id === id);
    if (!item) throw new Error('Item not found');

    const updateData: any = {};

    if (updates.name) updateData.name = updates.name;
    if (updates.tags) updateData.tags = updates.tags;
    if (updates.category) updateData.category = updates.category;

    // Re-encrypt if data changed
    if (updates.data) {
      const salt = generateSalt();
      const plaintext = JSON.stringify(updates.data);
      const { encrypted, iv, salt: saltBase64 } = await encrypt(plaintext, masterPassword, salt);
      updateData.encryptedData = encrypted;
      updateData.iv = iv;
      updateData.salt = saltBase64;
    }

    const response = await axios.put(`${API_URL}/vault/items/${id}`, updateData);
    setItems((prev) => prev.map((i) => (i.id === id ? response.data : i)));
    return response.data;
  };

  const deleteItem = async (id: string) => {
    await axios.delete(`${API_URL}/vault/items/${id}`);
    setItems((prev) => prev.filter((i) => i.id !== id));
  };

  return {
    items,
    loading,
    error,
    fetchItems,
    decryptItem,
    createItem,
    updateItem,
    deleteItem,
  };
}

