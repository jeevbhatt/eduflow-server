import { Router } from "express";
import { authenticate } from "../../../core/middleware/authenticate";
import { getCategories } from "../controllers/getCategories.controller";
import { getTopics } from "../controllers/getTopics.controller";
import { createTopic } from "../controllers/createTopic.controller";
import { getTopicDetails } from "../controllers/getTopicDetails.controller";
import { toggleTopicUpvote } from "../controllers/toggleTopicUpvote.controller";
import { getTopicPosts } from "../controllers/getTopicPosts.controller";
import { createPost } from "../controllers/createPost.controller";
import { markAcceptedAnswer } from "../controllers/markAcceptedAnswer.controller";

const router = Router();

// Category Routes
router.get("/categories", authenticate, getCategories);

// Topic Routes
router.get("/topics/:categoryId", authenticate, getTopics);
router.post("/topics", authenticate, createTopic);
router.get("/topics/detail/:topicId", authenticate, getTopicDetails);
router.post("/topics/:topicId/upvote", authenticate, toggleTopicUpvote);

// Post Routes
router.get("/posts/:topicId", authenticate, getTopicPosts);
router.post("/posts/:topicId", authenticate, createPost);
router.post("/topics/:topicId/posts/:postId/accept", authenticate, markAcceptedAnswer);

export default router;
