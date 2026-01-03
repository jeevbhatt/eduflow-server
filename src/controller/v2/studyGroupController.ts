/**
 * Study Group Controller
 *
 * Handles HTTP requests for study groups and sessions
 * Uses Prisma services with RLS context
 *
 * @module controller/v2/studyGroupController
 */

import { Response } from "express";
import { IExtendedRequest } from "../../middleware/type";
import { studyGroupService, RLSContext } from "../../services/prisma";
import { StudyGroupRole } from "../../generated/prisma/client";

/**
 * Build RLS context from request
 */
const getRLSContext = (req: IExtendedRequest): RLSContext => ({
  userId: req.user?.id || "",
  userRole: req.user?.role || "student",
  instituteId: req.user?.currentInstituteId,
});

// ============================================
// STUDY GROUP ENDPOINTS
// ============================================

/**
 * Get user's study groups
 */
export const getMyGroups = async (req: IExtendedRequest, res: Response) => {
  try {
    const context = getRLSContext(req);
    const userId = req.user?.id;
    const { page = "1", limit = "20" } = req.query;

    if (!userId) {
      return res.status(401).json({ message: "Authentication required" });
    }

    const groups = await studyGroupService.getUserStudyGroups(context, {
      page: parseInt(page as string),
      limit: parseInt(limit as string),
    });

    res.status(200).json({
      message: "Study groups fetched successfully",
      ...groups,
    });
  } catch (error: any) {
    console.error("Error fetching study groups:", error);
    res.status(500).json({
      message: "Error fetching study groups",
      error: error.message,
    });
  }
};

/**
 * Get discoverable study groups
 */
export const getDiscoverableGroups = async (
  req: IExtendedRequest,
  res: Response
) => {
  try {
    const context = getRLSContext(req);
    const instituteId = req.user?.currentInstituteId;
    const { courseId, page = "1", limit = "20" } = req.query;

    if (!instituteId) {
      return res.status(400).json({ message: "Institute ID is required" });
    }

    const groups = await studyGroupService.getInstituteStudyGroups(
      context,
      instituteId,
      {
        courseId: courseId as string | undefined,
        isPublic: true,
        page: parseInt(page as string),
        limit: parseInt(limit as string),
      }
    );

    res.status(200).json({
      message: "Discoverable groups fetched successfully",
      ...groups,
    });
  } catch (error: any) {
    console.error("Error fetching discoverable groups:", error);
    res.status(500).json({
      message: "Error fetching discoverable groups",
      error: error.message,
    });
  }
};

/**
 * Get single study group details
 */
export const getGroupDetails = async (req: IExtendedRequest, res: Response) => {
  try {
    const context = getRLSContext(req);
    const { groupId } = req.params;

    const group = await studyGroupService.getStudyGroup(context, groupId);

    if (!group) {
      return res.status(404).json({ message: "Study group not found" });
    }

    res.status(200).json({
      message: "Study group fetched successfully",
      data: group,
    });
  } catch (error: any) {
    console.error("Error fetching study group:", error);
    res.status(500).json({
      message: "Error fetching study group",
      error: error.message,
    });
  }
};

/**
 * Create a study group
 */
export const createGroup = async (req: IExtendedRequest, res: Response) => {
  try {
    const context = getRLSContext(req);
    const userId = req.user?.id;
    const instituteId = req.user?.currentInstituteId;
    const { name, description, courseId, maxMembers, isPublic } = req.body;

    if (!userId || !instituteId) {
      return res.status(401).json({ message: "Authentication required" });
    }

    if (!name) {
      return res.status(400).json({ message: "Group name is required" });
    }

    const group = await studyGroupService.createStudyGroup(context, {
      instituteId,
      name,
      description,
      courseId,
      maxMembers,
      isPublic,
    });

    res.status(201).json({
      message: "Study group created successfully",
      data: group,
    });
  } catch (error: any) {
    console.error("Error creating study group:", error);
    res.status(500).json({
      message: "Error creating study group",
      error: error.message,
    });
  }
};

/**
 * Update a study group
 */
export const updateGroup = async (req: IExtendedRequest, res: Response) => {
  try {
    const context = getRLSContext(req);
    const { groupId } = req.params;
    const { name, description, maxMembers, isPublic } = req.body;

    const group = await studyGroupService.updateStudyGroup(context, groupId, {
      name,
      description,
      maxMembers,
      isPublic,
    });

    res.status(200).json({
      message: "Study group updated successfully",
      data: group,
    });
  } catch (error: any) {
    console.error("Error updating study group:", error);
    res.status(500).json({
      message: "Error updating study group",
      error: error.message,
    });
  }
};

/**
 * Delete a study group
 */
export const deleteGroup = async (req: IExtendedRequest, res: Response) => {
  try {
    const context = getRLSContext(req);
    const { groupId } = req.params;

    await studyGroupService.deleteStudyGroup(context, groupId);

    res.status(200).json({
      message: "Study group deleted successfully",
    });
  } catch (error: any) {
    console.error("Error deleting study group:", error);
    res.status(500).json({
      message: "Error deleting study group",
      error: error.message,
    });
  }
};

/**
 * Join a study group
 */
export const joinGroup = async (req: IExtendedRequest, res: Response) => {
  try {
    const context = getRLSContext(req);
    const { groupId } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ message: "Authentication required" });
    }

    const membership = await studyGroupService.joinGroup(context, groupId);

    res.status(200).json({
      message: "Joined study group successfully",
      data: membership,
    });
  } catch (error: any) {
    console.error("Error joining study group:", error);
    res.status(400).json({
      message: error.message || "Error joining study group",
    });
  }
};

/**
 * Leave a study group
 */
export const leaveGroup = async (req: IExtendedRequest, res: Response) => {
  try {
    const context = getRLSContext(req);
    const { groupId } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ message: "Authentication required" });
    }

    await studyGroupService.leaveGroup(context, groupId);

    res.status(200).json({
      message: "Left study group successfully",
    });
  } catch (error: any) {
    console.error("Error leaving study group:", error);
    res.status(500).json({
      message: "Error leaving study group",
      error: error.message,
    });
  }
};

/**
 * Update member role
 */
export const updateMemberRole = async (
  req: IExtendedRequest,
  res: Response
) => {
  try {
    const context = getRLSContext(req);
    const { groupId, memberId } = req.params;
    const { role } = req.body;

    if (!role || !Object.values(StudyGroupRole).includes(role)) {
      return res.status(400).json({ message: "Valid role is required" });
    }

    const member = await studyGroupService.updateMemberRole(
      context,
      groupId,
      memberId,
      role as StudyGroupRole
    );

    res.status(200).json({
      message: "Member role updated successfully",
      data: member,
    });
  } catch (error: any) {
    console.error("Error updating member role:", error);
    res.status(500).json({
      message: "Error updating member role",
      error: error.message,
    });
  }
};

// ============================================
// STUDY SESSION ENDPOINTS
// ============================================

/**
 * Get upcoming sessions for user
 */
export const getUpcomingSessions = async (
  req: IExtendedRequest,
  res: Response
) => {
  try {
    const context = getRLSContext(req);
    const userId = req.user?.id;
    const { limit = "10" } = req.query;

    if (!userId) {
      return res.status(401).json({ message: "Authentication required" });
    }

    const sessions = await studyGroupService.getUserUpcomingSessions(
      context,
      parseInt(limit as string)
    );

    res.status(200).json({
      message: "Upcoming sessions fetched successfully",
      data: sessions,
    });
  } catch (error: any) {
    console.error("Error fetching upcoming sessions:", error);
    res.status(500).json({
      message: "Error fetching upcoming sessions",
      error: error.message,
    });
  }
};

/**
 * Get sessions for a group
 */
export const getGroupSessions = async (
  req: IExtendedRequest,
  res: Response
) => {
  try {
    const context = getRLSContext(req);
    const { groupId } = req.params;
    const { upcoming, page = "1", limit = "20" } = req.query;

    const sessions = await studyGroupService.getGroupSessions(
      context,
      groupId,
      upcoming === "true"
    );

    res.status(200).json({
      message: "Group sessions fetched successfully",
      ...sessions,
    });
  } catch (error: any) {
    console.error("Error fetching group sessions:", error);
    res.status(500).json({
      message: "Error fetching group sessions",
      error: error.message,
    });
  }
};

/**
 * Create a study session
 */
export const createSession = async (req: IExtendedRequest, res: Response) => {
  try {
    const context = getRLSContext(req);
    const userId = req.user?.id;
    const { groupId, title, description, scheduledAt, duration, meetingLink } =
      req.body;

    if (!userId) {
      return res.status(401).json({ message: "Authentication required" });
    }

    if (!groupId || !title || !scheduledAt || !duration) {
      return res.status(400).json({
        message: "Group ID, title, scheduled time, and duration are required",
      });
    }

    const session = await studyGroupService.createSession(context, {
      groupId,
      title,
      description,
      scheduledAt: new Date(scheduledAt),
      duration,
      meetingLink,
    });

    res.status(201).json({
      message: "Study session created successfully",
      data: session,
    });
  } catch (error: any) {
    console.error("Error creating study session:", error);
    res.status(500).json({
      message: "Error creating study session",
      error: error.message,
    });
  }
};

/**
 * Update a study session
 */
export const updateSession = async (req: IExtendedRequest, res: Response) => {
  try {
    const context = getRLSContext(req);
    const { sessionId } = req.params;
    const { title, description, scheduledAt, duration, meetingLink } = req.body;

    const session = await studyGroupService.updateSession(context, sessionId, {
      title,
      description,
      scheduledAt: scheduledAt ? new Date(scheduledAt) : undefined,
      duration,
      meetingLink,
    });

    res.status(200).json({
      message: "Study session updated successfully",
      data: session,
    });
  } catch (error: any) {
    console.error("Error updating study session:", error);
    res.status(500).json({
      message: "Error updating study session",
      error: error.message,
    });
  }
};

/**
 * Delete a study session
 */
export const deleteSession = async (req: IExtendedRequest, res: Response) => {
  try {
    const context = getRLSContext(req);
    const { sessionId } = req.params;

    await studyGroupService.deleteSession(context, sessionId);

    res.status(200).json({
      message: "Study session deleted successfully",
    });
  } catch (error: any) {
    console.error("Error deleting study session:", error);
    res.status(500).json({
      message: "Error deleting study session",
      error: error.message,
    });
  }
};
