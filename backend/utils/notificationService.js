// backend/utils/notificationService.js
import Notification from "../models/Notification.js";
import { emitToUser, emitToOwners, emitToAdmins, emitToFacility } from "../socket/index.js";
import Facility from "../models/Facility.js";

/**
 * Get unread count for a user
 */
export const getUnreadCount = async (userId) => {
  try {
    return await Notification.countDocuments({
      user: userId,
      isRead: false,
    });
  } catch (error) {
    console.error("Error getting unread count:", error);
    return 0;
  }
};

/**
 * Create a notification for a specific user and emit via socket
 * @param {Object} params - Notification parameters
 * @param {string} params.userId - User ID to receive notification
 * @param {string} params.type - Notification type (booking, payment, cancellation, etc.)
 * @param {string} params.title - Notification title
 * @param {string} params.message - Notification message
 * @param {Object} params.metadata - Additional metadata (bookingId, facilityId, etc.)
 * @param {string} params.priority - Priority level (low, normal, high)
 */
export const createNotification = async ({
  userId,
  type,
  title,
  message,
  metadata = {},
  priority = "normal",
}) => {
  try {
    // Create notification in database
    const notification = await Notification.create({
      user: userId,
      type,
      title,
      message,
      metadata,
      priority,
    });

    // Populate user for response
    await notification.populate("user", "name email");

    // Get unread count
    const unreadCount = await getUnreadCount(userId);

    // Emit via default namespace (for user-specific notifications)
    emitToUser(userId.toString(), "notification:new", {
      notification: notification.toObject(),
      unreadCount,
    });

    return notification;
  } catch (error) {
    console.error("Error creating notification:", error);
    throw error;
  }
};

/**
 * Notify owner of a facility about a new booking or status change
 * @param {Object} params - Notification parameters
 * @param {string} params.facilityId - Facility ID
 * @param {string} params.type - Notification type
 * @param {string} params.title - Notification title
 * @param {string} params.message - Notification message
 * @param {Object} params.metadata - Additional metadata
 * @param {boolean} params.createInDB - Whether to create notification in DB (default: true)
 */
export const notifyFacilityOwner = async ({
  facilityId,
  type,
  title,
  message,
  metadata = {},
  createInDB = true,
}) => {
  try {
    // Get facility owner
    const facility = await Facility.findById(facilityId).select("owner").lean();
    if (!facility || !facility.owner) {
      console.warn(`Facility ${facilityId} not found or has no owner`);
      return null;
    }

    const ownerId = facility.owner.toString();

    // Create notification in database if requested
    let notification = null;
    if (createInDB) {
      notification = await Notification.create({
        user: ownerId,
        type,
        title,
        message,
        metadata,
        priority: type === "booking" ? "high" : "normal",
      });

      await notification.populate("user", "name email");
    }

    // Get unread count
    const unreadCount = await getUnreadCount(ownerId);

    // Emit via default namespace (owner-specific notification)
    emitToUser(ownerId, "notification:new", {
      notification: notification ? notification.toObject() : { type, title, message, metadata },
      unreadCount,
    });

    // Also emit to owner namespace (broadcast)
    emitToOwners("notification:new", {
      facilityId,
      type,
      title,
      message,
      metadata,
      timestamp: Date.now(),
    });

    return notification;
  } catch (error) {
    console.error("Error notifying facility owner:", error);
    throw error;
  }
};

/**
 * Notify all owners (broadcast)
 * @param {Object} params - Notification parameters
 */
export const notifyAllOwners = async ({
  type,
  title,
  message,
  metadata = {},
  createInDB = false, // Usually false for broadcast notifications
}) => {
  try {
    // Emit to owner namespace (broadcast)
    emitToOwners("notification:new", {
      type,
      title,
      message,
      metadata,
      timestamp: Date.now(),
    });

    // If createInDB is true, create notifications for all owners
    // This is expensive, so usually false
    if (createInDB) {
      const facilities = await Facility.find({}).select("owner").lean();
      const ownerIds = [...new Set(facilities.map((f) => f.owner?.toString()).filter(Boolean))];

      await Promise.all(
        ownerIds.map((ownerId) =>
          Notification.create({
            user: ownerId,
            type,
            title,
            message,
            metadata,
            priority: "normal",
          })
        )
      );
    }

    return true;
  } catch (error) {
    console.error("Error notifying all owners:", error);
    throw error;
  }
};

/**
 * Notify all admins (broadcast)
 * @param {Object} params - Notification parameters
 */
export const notifyAllAdmins = async ({
  type,
  title,
  message,
  metadata = {},
  createInDB = false, // Usually false for broadcast notifications
}) => {
  try {
    // Emit to admin namespace (broadcast)
    emitToAdmins("notification:new", {
      type,
      title,
      message,
      metadata,
      timestamp: Date.now(),
    });

    // If createInDB is true, find all admins and create notifications
    if (createInDB) {
      const User = (await import("../models/User.js")).default;
      const admins = await User.find({ role: "admin" }).select("_id").lean();
      
      await Promise.all(
        admins.map((admin) =>
          Notification.create({
            user: admin._id,
            type,
            title,
            message,
            metadata,
            priority: "high",
          })
        )
      );
    }

    return true;
  } catch (error) {
    console.error("Error notifying all admins:", error);
    throw error;
  }
};

/**
 * Notify users in a facility room (broadcast to all users viewing the facility)
 * @param {Object} params - Notification parameters
 */
export const notifyFacilityUsers = async ({
  facilityId,
  type,
  title,
  message,
  metadata = {},
}) => {
  try {
    // Emit to facility room (all users viewing this facility)
    emitToFacility(facilityId, "notification:new", {
      type,
      title,
      message,
      metadata,
      timestamp: Date.now(),
    });

    return true;
  } catch (error) {
    console.error("Error notifying facility users:", error);
    throw error;
  }
};

