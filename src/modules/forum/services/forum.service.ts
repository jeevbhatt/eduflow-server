import forumRepo from "../repository/forum.repo";

export class ForumService {
  // --- Category Services ---
  async getCategories(instituteId: string) {
    return forumRepo.findCategoriesByInstitute(instituteId);
  }

  // --- Topic Services ---
  async getTopics(categoryId: string, filters: any) {
    return forumRepo.findTopicsByCategory(categoryId, filters);
  }

  async getTopicDetails(topicId: string) {
    const topic = await forumRepo.findTopicById(topicId);
    if (topic) {
      await forumRepo.incrementTopicViews(topicId);
    }
    return topic;
  }

  async createTopic(data: { categoryId: string; authorId: string; title: string; content: string; tags?: string[] }) {
    return forumRepo.createTopic(data);
  }

  async toggleTopicUpvote(topicId: string, isUpvote: boolean) {
    return forumRepo.updateTopic(topicId, {
      upvotes: isUpvote ? { increment: 1 } : { decrement: 1 },
    });
  }

  async setTopicPinned(topicId: string, isPinned: boolean) {
    return forumRepo.updateTopic(topicId, { isPinned });
  }

  // --- Post Services ---
  async getTopicPosts(topicId: string, filters: any) {
    return forumRepo.findPostsByTopic(topicId, filters);
  }

  async createPost(data: { topicId: string; authorId: string; content: string; parentId?: string }) {
    return forumRepo.createPost(data);
  }

  async togglePostUpvote(postId: string, isUpvote: boolean) {
    return forumRepo.updatePost(postId, {
      upvotes: isUpvote ? { increment: 1 } : { decrement: 1 },
    });
  }

  async markAcceptedAnswer(topicId: string, postId: string) {
    return forumRepo.setAcceptedAnswer(topicId, postId);
  }
}

export default new ForumService();
