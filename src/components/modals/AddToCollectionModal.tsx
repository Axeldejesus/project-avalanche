"use client";

import React, { useState, useEffect } from 'react';
import Modal from './Modal';
import styles from '../../styles/Modal.module.css';
import collectionStyles from '../../styles/CollectionModal.module.css';
import { FiCheck, FiClock, FiPlay, FiAward, FiX, FiHeart, FiInfo, FiTrash2, FiPlus, FiRefreshCw, FiList, FiEdit } from 'react-icons/fi';
import { FaSpinner } from 'react-icons/fa';
import { addToCollection, getUserGameInCollection, removeFromCollection } from '../../services/collectionService';
import { type CollectionItem } from '../../schemas';
import { 
  getUserLists, 
  getListsContainingGame, 
  addGameToList, 
  removeGameFromList 
} from '../../services/listService';
import { type List } from '../../schemas';
import { useAuth } from '../../context/AuthContext';

// Define the type for collection status
type CollectionStatus = "completed" | "playing" | "toPlay" | "abandoned" | "wishlist";

interface AddToCollectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  gameId: number;
  gameName: string;
  gameCover: string;
  onCollectionUpdated?: () => void;
}

// Collection status options with icons and descriptions
const COLLECTION_STATUSES = [
  { 
    id: 'playing' as CollectionStatus, 
    label: 'Currently Playing', 
    icon: <FiPlay />, 
    description: 'Games you are actively playing right now'
  },
  { 
    id: 'completed' as CollectionStatus, 
    label: 'Completed', 
    icon: <FiAward />, 
    description: 'Games you have finished playing'
  },
  { 
    id: 'toPlay' as CollectionStatus, 
    label: 'Plan to Play', 
    icon: <FiClock />, 
    description: 'Games you plan to play in the future'
  },
  { 
    id: 'abandoned' as CollectionStatus, 
    label: 'Abandoned', 
    icon: <FiX />, 
    description: 'Games you started but don\'t plan to finish'
  },
  { 
    id: 'wishlist' as CollectionStatus, 
    label: 'Wishlist', 
    icon: <FiHeart />, 
    description: 'Games you want to buy in the future'
  }
];

const AddToCollectionModal: React.FC<AddToCollectionModalProps> = ({ 
  isOpen, 
  onClose, 
  gameId, 
  gameName, 
  gameCover,
  onCollectionUpdated
}) => {
  const [selectedStatus, setSelectedStatus] = useState<CollectionStatus>('playing');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [existingItem, setExistingItem] = useState<CollectionItem | null>(null);
  const [activeTab, setActiveTab] = useState<'collection' | 'lists'>('collection');
  const [customLists, setCustomLists] = useState<List[]>([]);
  const [listsContainingGame, setListsContainingGame] = useState<List[]>([]);
  const [loadingLists, setLoadingLists] = useState<boolean>(false);
  const [processingListId, setProcessingListId] = useState<string | null>(null);
  const { user } = useAuth();

  // Check if game is already in collection when modal opens
  useEffect(() => {
    if (isOpen && user) {
      // Load collection data
      const checkExistingItem = async () => {
        const item = await getUserGameInCollection(user.uid, gameId);
        if (item) {
          setExistingItem(item);
          setSelectedStatus(item.status);
        } else {
          // Reset form if no existing item
          setExistingItem(null);
          setSelectedStatus('playing');
        }
      };
      
      checkExistingItem();
      
      // Load custom lists
      loadCustomLists();
    }
  }, [isOpen, user, gameId]);

  // Load user's custom lists and check which ones contain this game
  const loadCustomLists = async () => {
    if (!user) return;
    
    setLoadingLists(true);
    
    try {
      // Get all user lists
      const listsResult = await getUserLists(user.uid);
      
      if (listsResult.error) {
        console.error('Error loading lists:', listsResult.error);
        return;
      }
      
      setCustomLists(listsResult.lists);
      
      // Check which lists already contain this game
      const containingResult = await getListsContainingGame(user.uid, gameId);
      
      if (containingResult.error) {
        console.error('Error loading lists containing game:', containingResult.error);
        return;
      }
      
      setListsContainingGame(containingResult.lists);
    } catch (error) {
      console.error('Error loading custom lists:', error);
    } finally {
      setLoadingLists(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      setError('You must be logged in to add games to your collection');
      return;
    }
    
    setIsSubmitting(true);
    setError(null);
    setSuccess(null);
    
    try {
      const result = await addToCollection({
        userId: user.uid,
        gameId,
        gameName,
        gameCover,
        status: selectedStatus
      });
      
      if (result.success) {
        setSuccess(existingItem 
          ? 'Game status updated in your collection!' 
          : 'Game added to your collection!');
        
        // Update existing item state
        const updatedItem = await getUserGameInCollection(user.uid, gameId);
        setExistingItem(updatedItem);
        
        // Notify parent component
        if (onCollectionUpdated) {
          onCollectionUpdated();
        }
        
        // Remove automatic modal close - let user close it manually
        // setTimeout(() => {
        //   onClose();
        // }, 1500);
      } else {
        setError(result.error || 'Failed to update collection');
      }
    } catch (error: any) {
      console.error('Error updating collection:', error);
      setError(error.message || 'An unexpected error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRemoveFromCollection = async (e: React.MouseEvent) => {
    e.preventDefault();
    
    if (!user) {
      setError('You must be logged in to update your collection');
      return;
    }
    
    if (window.confirm(`Are you sure you want to remove "${gameName}" from your collection?`)) {
      setIsDeleting(true);
      setError(null);
      setSuccess(null);
      
      try {
        const result = await removeFromCollection(gameId);
        
        if (result.success) {
          setSuccess('Game removed from your collection!');
          setExistingItem(null);
          
          // Notify parent component
          if (onCollectionUpdated) {
            onCollectionUpdated();
          }
          
          // Keep the modal open after removing - show success message
          // User can close manually
          // setTimeout(() => {
          //   onClose();
          // }, 1500);
        } else {
          setError(result.error || 'Failed to remove from collection');
        }
      } catch (error: any) {
        console.error('Error removing from collection:', error);
        setError(error.message || 'An unexpected error occurred');
      } finally {
        setIsDeleting(false);
      }
    }
  };

  const handleStatusSelect = (status: CollectionStatus) => {
    setSelectedStatus(status);
  };

  // Handle adding or removing a game from a custom list
  const handleToggleList = async (listId: string, isInList: boolean) => {
    if (!user) {
      setError('You must be logged in to update your lists');
      return;
    }
    
    setProcessingListId(listId);
    setError(null);
    
    try {
      if (isInList) {
        // Remove game from list
        const result = await removeGameFromList(listId, gameId);
        
        if (result.success) {
          // Update the lists containing this game
          setListsContainingGame(prev => prev.filter(list => list.id !== listId));
          setSuccess('Game removed from list');
          
          // Clear success message after a delay but don't close modal
          setTimeout(() => {
            setSuccess(null);
          }, 2000);
        } else {
          setError(result.error || 'Failed to remove game from list');
        }
      } else {
        // Add game to list
        const result = await addGameToList(listId, {
          gameId,
          gameName,
          gameCover,
          notes: ''
        });
        
        if (result.success) {
          // Find the list in customLists and add it to listsContainingGame
          const addedList = customLists.find(list => list.id === listId);
          if (addedList) {
            setListsContainingGame(prev => [...prev, addedList]);
          }
          
          setSuccess('Game added to list');
          
          // Clear success message after a delay but don't close modal
          setTimeout(() => {
            setSuccess(null);
          }, 2000);
        } else {
          setError(result.error || 'Failed to add game to list');
        }
      }
    } catch (error: any) {
      console.error('Error updating list:', error);
      setError(error.message || 'An unexpected error occurred');
    } finally {
      setProcessingListId(null);
    }
  };

  // Check if a game is in a specific list
  const isGameInList = (listId: string): boolean => {
    return listsContainingGame.some(list => list.id === listId);
  };

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose} 
      title={existingItem ? "Update Collection Status" : "Add to Collection"}
      className={styles.collectionModal}
    >
      <div className={collectionStyles.gameInfo}>
        <img 
          src={gameCover} 
          alt={gameName}
          className={collectionStyles.gameCover}
        />
        <div className={collectionStyles.gameDetails}>
          <h3 className={collectionStyles.gameName}>{gameName}</h3>
          {existingItem && (
            <div className={collectionStyles.currentStatus}>
              Currently: <span>{COLLECTION_STATUSES.find(s => s.id === existingItem.status)?.label || existingItem.status}</span>
            </div>
          )}
        </div>
      </div>
      
      {/* Tabs for Collection and Lists */}
      <div className={collectionStyles.tabs}>
        <button 
          className={`${collectionStyles.tab} ${activeTab === 'collection' ? collectionStyles.activeTab : ''}`}
          onClick={() => setActiveTab('collection')}
        >
          <FiPlay className={collectionStyles.tabIcon} />
          Collection Status
        </button>
        <button 
          className={`${collectionStyles.tab} ${activeTab === 'lists' ? collectionStyles.activeTab : ''}`}
          onClick={() => setActiveTab('lists')}
        >
          <FiList className={collectionStyles.tabIcon} />
          Custom Lists
        </button>
      </div>
      
      {error && <div className={styles.errorMessage}>{error}</div>}
      {success && <div className={styles.successMessage}>{success}</div>}
      
      {/* Collection Tab Content */}
      {activeTab === 'collection' && (
        <form className={styles.form} onSubmit={handleSubmit}>
          <div className={collectionStyles.statusOptionsContainer}>
            <label className={styles.formLabel}>Select status:</label>
            <div className={collectionStyles.statusOptions}>
              {COLLECTION_STATUSES.map((status) => (
                <div 
                  key={status.id}
                  className={`${collectionStyles.statusOption} ${selectedStatus === status.id ? collectionStyles.selected : ''}`}
                  onClick={() => handleStatusSelect(status.id)}
                >
                  <div className={collectionStyles.statusIcon}>
                    {status.icon}
                  </div>
                  <div className={collectionStyles.statusLabel}>
                    {status.label}
                  </div>
                </div>
              ))}
            </div>
            
            <div className={collectionStyles.statusDescription}>
              <FiInfo className={collectionStyles.infoIcon} />
              <span>{COLLECTION_STATUSES.find(s => s.id === selectedStatus)?.description}</span>
            </div>
          </div>
          
          <div className={styles.buttonGroup}>
            <button 
              type="submit" 
              className={`${styles.submit} ${collectionStyles.addButton}`}
              disabled={isSubmitting || isDeleting}
            >
              {isSubmitting ? (
                <>
                  <FaSpinner className={styles.spinner} /> 
                  {existingItem ? 'Updating...' : 'Adding...'}
                </>
              ) : (
                <>
                  {existingItem ? <FiRefreshCw className={styles.buttonIcon} /> : <FiPlus className={styles.buttonIcon} />}
                  {existingItem ? 'Update in Collection' : 'Add to Collection'}
                </>
              )}
            </button>
            
            {existingItem && (
              <button
                type="button"
                onClick={handleRemoveFromCollection}
                className={`${styles.dangerButton} ${collectionStyles.removeButton}`}
                disabled={isSubmitting || isDeleting}
              >
                {isDeleting ? (
                  <>
                    <FaSpinner className={styles.spinner} /> 
                    Removing...
                  </>
                ) : (
                  <>
                    <FiTrash2 className={styles.buttonIcon} /> 
                    Remove
                  </>
                )}
              </button>
            )}
          </div>
        </form>
      )}
      
      {/* Lists Tab Content */}
      {activeTab === 'lists' && (
        <div className={collectionStyles.listsContainer}>
          {loadingLists ? (
            <div className={collectionStyles.loadingLists}>
              <FaSpinner className={styles.spinner} />
              <p>Loading your lists...</p>
            </div>
          ) : customLists.length === 0 ? (
            <div className={collectionStyles.noLists}>
              <FiList className={collectionStyles.noListsIcon} />
              <p className={collectionStyles.noListsTitle}>No custom lists yet</p>
              <p className={collectionStyles.noListsMessage}>
                Create your first custom list in the Collections page
              </p>
            </div>
          ) : (
            <>
              <p className={collectionStyles.listsInstructions}>
                Add or remove this game from your custom lists:
              </p>
              
              <div className={collectionStyles.listsList}>
                {customLists.map(list => {
                  const inList = isGameInList(list.id || '');
                  
                  return (
                    <div 
                      key={list.id} 
                      className={`${collectionStyles.listItem} ${inList ? collectionStyles.inList : ''}`}
                    >
                      <div className={collectionStyles.listInfo}>
                        <div className={collectionStyles.listName}>{list.name}</div>
                        {list.description && (
                          <div className={collectionStyles.listDescription}>{list.description}</div>
                        )}
                      </div>
                      
                      <button
                        type="button"
                        onClick={() => handleToggleList(list.id || '', inList)}
                        className={`${collectionStyles.listToggleButton} ${inList ? collectionStyles.removeListButton : collectionStyles.addListButton}`}
                        disabled={processingListId === list.id}
                      >
                        {processingListId === list.id ? (
                          <FaSpinner className={styles.spinner} />
                        ) : inList ? (
                          <>
                            <FiCheck className={collectionStyles.listButtonIcon} />
                            In List
                          </>
                        ) : (
                          <>
                            <FiPlus className={collectionStyles.listButtonIcon} />
                            Add
                          </>
                        )}
                      </button>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      )}
    </Modal>
  );
};

export default AddToCollectionModal;
