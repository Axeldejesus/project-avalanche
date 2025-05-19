"use client";

import React, { useState, useEffect } from 'react';
import Modal from './Modal';
import styles from '../../styles/Modal.module.css';
import collectionStyles from '../../styles/CollectionModal.module.css';
import { FiCheck, FiClock, FiPlay, FiAward, FiX, FiHeart, FiInfo, FiTrash2 } from 'react-icons/fi';
import { FaSpinner } from 'react-icons/fa';
import { addToCollection, getUserGameInCollection, CollectionItem, removeFromCollection } from '../../services/collectionService';
import { useAuth } from '../../context/AuthContext';

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
    id: 'playing', 
    label: 'Currently Playing', 
    icon: <FiPlay />, 
    description: 'Games you are actively playing right now'
  },
  { 
    id: 'completed', 
    label: 'Completed', 
    icon: <FiAward />, 
    description: 'Games you have finished playing'
  },
  { 
    id: 'toPlay', 
    label: 'Plan to Play', 
    icon: <FiClock />, 
    description: 'Games you plan to play in the future'
  },
  { 
    id: 'abandoned', 
    label: 'Abandoned', 
    icon: <FiX />, 
    description: 'Games you started but don\'t plan to finish'
  },
  { 
    id: 'wishlist', 
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
  const [selectedStatus, setSelectedStatus] = useState<string>('playing');
  const [hoursPlayed, setHoursPlayed] = useState<number | undefined>(undefined);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [existingItem, setExistingItem] = useState<CollectionItem | null>(null);
  const { user } = useAuth();

  // Check if game is already in collection when modal opens
  useEffect(() => {
    if (isOpen && user) {
      const checkExistingItem = async () => {
        const item = await getUserGameInCollection(user.uid, gameId);
        if (item) {
          setExistingItem(item);
          setSelectedStatus(item.status);
          setHoursPlayed(item.hoursPlayed);
        } else {
          // Reset form if no existing item
          setExistingItem(null);
          setSelectedStatus('playing');
          setHoursPlayed(undefined);
        }
      };
      
      checkExistingItem();
    }
  }, [isOpen, user, gameId]);

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
        status: selectedStatus,
        hoursPlayed: selectedStatus === 'completed' ? hoursPlayed : undefined
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
        
        // Close modal after a short delay
        setTimeout(() => {
          onClose();
        }, 1500);
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
          
          // Close modal after a short delay
          setTimeout(() => {
            onClose();
          }, 1500);
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

  const handleStatusSelect = (status: string) => {
    setSelectedStatus(status);
    
    // Reset hours played if switching away from completed
    if (status !== 'completed') {
      setHoursPlayed(undefined);
    }
  };

  const handleHoursPlayedChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value === '') {
      setHoursPlayed(undefined);
    } else {
      const numValue = parseFloat(value);
      if (!isNaN(numValue) && numValue >= 0) {
        setHoursPlayed(numValue);
      }
    }
  };

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose} 
      title={existingItem ? "Update Collection Status" : "Add to Collection"}
      className={styles.collectionModal}
    >
      <form className={styles.form} onSubmit={handleSubmit}>
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
                {selectedStatus === status.id && (
                  <div className={collectionStyles.selectedIndicator}>
                    <FiCheck />
                  </div>
                )}
              </div>
            ))}
          </div>
          
          <div className={collectionStyles.statusDescription}>
            <FiInfo className={collectionStyles.infoIcon} />
            <span>{COLLECTION_STATUSES.find(s => s.id === selectedStatus)?.description}</span>
          </div>
        </div>
        
        {error && <div className={styles.errorMessage}>{error}</div>}
        {success && <div className={styles.successMessage}>{success}</div>}
        
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
              existingItem ? 'Update in Collection' : 'Add to Collection'
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
                  <FiTrash2 /> 
                  Remove from Collection
                </>
              )}
            </button>
          )}
        </div>
      </form>
    </Modal>
  );
};

export default AddToCollectionModal;
