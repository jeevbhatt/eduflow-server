import studyGroupRepo from "../repository/studyGroup.repo";
import { StudyGroupRole } from "@prisma/client";

export class StudyGroupService {
  async createGroup(data: { instituteId: string; userId: string; name: string; description?: string; maxMembers?: number; isPublic?: boolean; courseId?: string }) {
    const group = await studyGroupRepo.create({
      instituteId: data.instituteId,
      name: data.name,
      description: data.description,
      maxMembers: data.maxMembers || 10,
      isPublic: data.isPublic ?? true,
      courseId: data.courseId,
      createdBy: data.userId,
    });

    // Automatically add creator as admin
    await studyGroupRepo.joinGroup(group.id, data.userId, StudyGroupRole.admin);
    return group;
  }

  async getInstituteGroups(instituteId: string, filters: any) {
    return studyGroupRepo.findByInstitute(instituteId, filters);
  }

  async getUserGroups(userId: string) {
    return studyGroupRepo.findUserGroups(userId);
  }

  async getGroupDetails(groupId: string) {
    return studyGroupRepo.findById(groupId);
  }

  async joinGroup(groupId: string, userId: string) {
    const group = await studyGroupRepo.findById(groupId);
    if (!group) throw new Error("Group not found");
    if (!group.isPublic) throw new Error("This is a private group");

    const existingMember = await studyGroupRepo.findMember(groupId, userId);
    if (existingMember) throw new Error("Already a member");

    // Check capacity
    const memberCount = await studyGroupRepo.countMembers(groupId);
    if (group.maxMembers && memberCount >= group.maxMembers) {
      throw new Error("Group is full");
    }

    return studyGroupRepo.joinGroup(groupId, userId);
  }

  async leaveGroup(groupId: string, userId: string) {
    return studyGroupRepo.leaveGroup(groupId, userId);
  }

  async getGroupSessions(groupId: string, upcoming: boolean) {
    return studyGroupRepo.findSessionsByGroup(groupId, upcoming);
  }

  async createSession(data: { groupId: string; userId: string; title: string; description?: string; scheduledAt: Date; duration: number; meetingLink?: string }) {
    // Verify membership
    const member = await studyGroupRepo.findMember(data.groupId, data.userId);
    if (!member) throw new Error("Not a member of this group");

    return studyGroupRepo.createSession({
      groupId: data.groupId,
      title: data.title,
      description: data.description,
      scheduledAt: data.scheduledAt,
      duration: data.duration,
      meetingLink: data.meetingLink,
      createdBy: data.userId,
    });
  }
}

export default new StudyGroupService();
