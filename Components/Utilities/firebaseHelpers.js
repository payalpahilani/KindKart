import { doc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "../../firebaseConfig";

/* ------------------------------------------------------------------ */
/* 1.  Badge catalogue – tweak thresholds/fields here only            */
/* ------------------------------------------------------------------ */
const badgeCriteria = {
  firstDonation:   { field: "donationCount",  required: 1  },    // ≥ 1 donation
  kindSoul:        { field: "totalDonated",   required: 5  },    // ≥ 5 donation
  generousHeart:   { field: "totalDonated",   required: 100 },   // ≥ $100 donated
  firstListing:    { field: "listingCount",   required: 1  },    // ≥ 1 listing
  communitySeller: { field: "listingCount",   required: 5  },    // ≥ 5 listings
  helperBee:       { field: "sharedCount",    required: 3  },    // ≥ 3 shares
  profilePro:      { field: "profileCompleted", required: true } // flag must be true
};

/* ------------------------------------------------------------------ */
/* 2.  Central helper                                                 */
/* ------------------------------------------------------------------ */
/**
 * Checks all badge rules for a user and marks any newly‑earned badges.
 * @param {string}  userId            Firebase Auth UID
 * @param {object?} updatedUserData   Pass in fresh user data if you already
 *                                    have it – saves one Firestore read.
 * @returns {Promise<string[]>}       Array of badge keys just unlocked
 */
export const checkAndAwardBadges = async (userId, updatedUserData = null) => {
  try {
    const userRef  = doc(db, "users", userId);
    const userSnap = updatedUserData
      ? { exists: () => true, data: () => updatedUserData }
      : await getDoc(userRef);

    if (!userSnap.exists()) return [];

    const userData      = userSnap.data();
    const currentBadges = userData.badges || {};
    const updatedBadges = { ...currentBadges };
    const newlyUnlocked = [];

    /* ------------- core loop -------------------------------------- */
    Object.entries(badgeCriteria).forEach(([badgeKey, criteria]) => {
      const currentValue = userData[criteria.field];

      const meetsRequirement =
        typeof criteria.required === "boolean"
          ? currentValue === criteria.required            // exact match for boolean flags
          : (currentValue || 0) >= criteria.required;     // >= for numeric counters

      if (meetsRequirement && !currentBadges[badgeKey]) {
        updatedBadges[badgeKey] = true;
        newlyUnlocked.push(badgeKey);
        console.log(`🏅 Badge earned: ${badgeKey}`);
      }
    });

    /* ------------- write back only if something changed ---------- */
    if (newlyUnlocked.length > 0) {
      await updateDoc(userRef, { badges: updatedBadges });
    }

    return newlyUnlocked;
  } catch (err) {
    console.error("Error awarding badges:", err);
    return [];
  }
};
