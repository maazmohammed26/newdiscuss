// User Profile Database Service - Uses Secondary Firebase (Firestore)
// Stores: fullName, bio, socialLinks
// Uses same Auth UID as primary Firebase for sync

import {
  firestoreDb,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  deleteField,
  serverTimestamp
} from './firebaseSecondary';

// Collection name for user profiles
const USER_PROFILES_COLLECTION = 'userProfiles';

// Character limit for bio
export const BIO_CHAR_LIMIT = 500;

/**
 * Get user profile from Firestore
 * @param {string} userId - Firebase Auth UID
 * @returns {Promise<Object|null>} User profile data or null
 */
export const getUserProfile = async (userId) => {
  try {
    const profileRef = doc(firestoreDb, USER_PROFILES_COLLECTION, userId);
    const profileSnap = await getDoc(profileRef);
    
    if (profileSnap.exists()) {
      return {
        id: userId,
        ...profileSnap.data(),
        socialLinks: profileSnap.data().socialLinks || []
      };
    }
    return null;
  } catch (error) {
    console.error('Error getting user profile:', error);
    return null;
  }
};

/**
 * Create or update user profile in Firestore
 * @param {string} userId - Firebase Auth UID
 * @param {Object} profileData - Profile data to save
 * @returns {Promise<Object>} Updated profile data
 */
export const saveUserProfile = async (userId, profileData) => {
  try {
    const profileRef = doc(firestoreDb, USER_PROFILES_COLLECTION, userId);
    const profileSnap = await getDoc(profileRef);
    
    const dataToSave = {
      ...profileData,
      updatedAt: serverTimestamp()
    };
    
    if (profileSnap.exists()) {
      await updateDoc(profileRef, dataToSave);
    } else {
      await setDoc(profileRef, {
        ...dataToSave,
        createdAt: serverTimestamp()
      });
    }
    
    return { id: userId, ...profileData };
  } catch (error) {
    console.error('Error saving user profile:', error);
    throw error;
  }
};

/**
 * Update full name
 * @param {string} userId - Firebase Auth UID
 * @param {string} fullName - Full name to save
 */
export const updateFullName = async (userId, fullName) => {
  return saveUserProfile(userId, { fullName: fullName.trim() });
};

/**
 * Delete full name
 * @param {string} userId - Firebase Auth UID
 */
export const deleteFullName = async (userId) => {
  try {
    const profileRef = doc(firestoreDb, USER_PROFILES_COLLECTION, userId);
    await updateDoc(profileRef, {
      fullName: deleteField(),
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    console.error('Error deleting full name:', error);
    throw error;
  }
};

/**
 * Update bio
 * @param {string} userId - Firebase Auth UID
 * @param {string} bio - Bio text (max 500 chars)
 */
export const updateBio = async (userId, bio) => {
  const trimmedBio = bio.trim().slice(0, BIO_CHAR_LIMIT);
  return saveUserProfile(userId, { bio: trimmedBio });
};

/**
 * Delete bio
 * @param {string} userId - Firebase Auth UID
 */
export const deleteBio = async (userId) => {
  try {
    const profileRef = doc(firestoreDb, USER_PROFILES_COLLECTION, userId);
    await updateDoc(profileRef, {
      bio: deleteField(),
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    console.error('Error deleting bio:', error);
    throw error;
  }
};

/**
 * Update social links
 * @param {string} userId - Firebase Auth UID
 * @param {Array<{name: string, url: string}>} socialLinks - Array of social links
 */
export const updateSocialLinks = async (userId, socialLinks) => {
  // Validate and clean social links
  const cleanedLinks = socialLinks
    .filter(link => link.name && link.url)
    .map(link => ({
      name: link.name.trim(),
      url: link.url.trim()
    }));
  
  return saveUserProfile(userId, { socialLinks: cleanedLinks });
};

/**
 * Add a single social link
 * @param {string} userId - Firebase Auth UID
 * @param {Object} link - {name: string, url: string}
 */
export const addSocialLink = async (userId, link) => {
  const profile = await getUserProfile(userId);
  const currentLinks = profile?.socialLinks || [];
  const updatedLinks = [...currentLinks, { name: link.name.trim(), url: link.url.trim() }];
  return updateSocialLinks(userId, updatedLinks);
};

/**
 * Update a single social link
 * @param {string} userId - Firebase Auth UID
 * @param {number} index - Index of link to update
 * @param {Object} link - {name: string, url: string}
 */
export const editSocialLink = async (userId, index, link) => {
  const profile = await getUserProfile(userId);
  const currentLinks = profile?.socialLinks || [];
  
  if (index >= 0 && index < currentLinks.length) {
    currentLinks[index] = { name: link.name.trim(), url: link.url.trim() };
    return updateSocialLinks(userId, currentLinks);
  }
  throw new Error('Invalid link index');
};

/**
 * Delete a single social link
 * @param {string} userId - Firebase Auth UID
 * @param {number} index - Index of link to delete
 */
export const deleteSocialLink = async (userId, index) => {
  const profile = await getUserProfile(userId);
  const currentLinks = profile?.socialLinks || [];
  
  if (index >= 0 && index < currentLinks.length) {
    currentLinks.splice(index, 1);
    return updateSocialLinks(userId, currentLinks);
  }
  throw new Error('Invalid link index');
};
