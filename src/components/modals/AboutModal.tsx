"use client";

import React from 'react';
import Modal from './Modal';
import styles from '../../styles/AboutModal.module.css';
import { FiCalendar, FiUsers, FiStar, FiBarChart2 } from 'react-icons/fi';
import { RiGamepadFill } from 'react-icons/ri';
import { BsCollectionPlay, BsListCheck } from 'react-icons/bs';

interface AboutModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const AboutModal: React.FC<AboutModalProps> = ({ isOpen, onClose }) => {
  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose} 
      title="Welcome to Avalanche"
      className={styles.aboutModal}
    >
      <div className={styles.modalContent}>
        <div className={styles.introSection}>
          <h2>Your Personal Gaming Universe</h2>
          <p>
            Avalanche is your all-in-one platform for discovering, tracking, and celebrating 
            your gaming journey. Whether you're hunting for your next adventure or organizing 
            your collection, we've got you covered.
          </p>
        </div>

        <div className={styles.featuresGrid}>
          <div className={styles.featureCard}>
            <div className={styles.featureIcon}>
              <RiGamepadFill size={28} />
            </div>
            <h3>Discover Games</h3>
            <p>
              Browse thousands of games with advanced filters. Search by platform, 
              genre, release date, and more to find exactly what you're looking for.
            </p>
          </div>

          <div className={styles.featureCard}>
            <div className={styles.featureIcon}>
              <FiCalendar size={28} />
            </div>
            <h3>Release Calendar</h3>
            <p>
              Never miss a release! Stay updated with our interactive calendar 
              showing upcoming games for all your favorite platforms.
            </p>
          </div>

          <div className={styles.featureCard}>
            <div className={styles.featureIcon}>
              <BsCollectionPlay size={28} />
            </div>
            <h3>Build Your Collection</h3>
            <p>
              Track games you're playing, completed, or planning to play. 
              Organize your gaming library with custom statuses and personal notes.
            </p>
          </div>

          <div className={styles.featureCard}>
            <div className={styles.featureIcon}>
              <BsListCheck size={28} />
            </div>
            <h3>Create Custom Lists</h3>
            <p>
              Make themed lists for any occasion. Share your top picks, 
              hidden gems, or games for specific moods with the community.
            </p>
          </div>

          <div className={styles.featureCard}>
            <div className={styles.featureIcon}>
              <FiStar size={28} />
            </div>
            <h3>Rate & Review</h3>
            <p>
              Share your thoughts! Rate games and write reviews to help 
              others discover great experiences and avoid disappointments.
            </p>
          </div>

          <div className={styles.featureCard}>
            <div className={styles.featureIcon}>
              <FiBarChart2 size={28} />
            </div>
            <h3>Track Your Stats</h3>
            <p>
              Visualize your gaming habits with detailed statistics. 
              See your most played genres, platform preferences, and collection growth.
            </p>
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default AboutModal;
