import { Request, Response } from "express";
import commentRepository from "../repositories/comment.repository";
import { CreateCommentDto, UpdateCommentDto } from "../models/comment.model";

export const getAllComments = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const comments = await commentRepository.getAllComments();
    res.status(200).json(comments);
  } catch (error) {
    res.status(500).json({ error: "Failed to retrieve comments" });
  }
};

export const getCommentsByTaskId = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const taskid = req.params.id;
    const comments = await commentRepository.getCommentsByTaskId(taskid);
    res.status(200).json(comments);
  } catch (error) {
    res.status(500).json({ error: "Failed to retrieve comments" });
  }
};

export const getCommentById = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const commentId = req.params.id;
    const comment = await commentRepository.getCommentById(commentId);
    res.status(200).json(comment);
  } catch (error) {
    if (error instanceof Error && error.message === "Comment not found") {
      res.status(404).json({ error: "Comment not found" });
    } else {
      res.status(500).json({ error: "Failed to retrieve comment" });
    }
  }
};

export const createComment = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const commentData: CreateCommentDto = req.body;

    if (!commentData.text) {
      res.status(400).json({ error: "Text is required" });
      return;
    }

    if (!commentData.taskId) {
      res.status(400).json({ error: "Task id is required" });
      return;
    }

    const comment = await commentRepository.createComment(commentData);
    res.status(201).json(comment);
  } catch (error) {
    res.status(500).json({ error: "Failed to create comment" });
  }
};

export const updateComment = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const commentId = req.params.id;
    const updateData: UpdateCommentDto = req.body;

    const comment = await commentRepository.updateComment(
      commentId,
      updateData
    );
    res.status(200).json(comment);
  } catch (error) {
    if (error instanceof Error && error.message === "Comment not found") {
      res.status(404).json({ error: "Comment not found" });
    } else {
      res.status(500).json({ error: "Failed to update comment" });
    }
  }
};

export const deleteComment = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const commentId = req.params.id;
    await commentRepository.deleteComment(commentId);
    res.status(204).send();
  } catch (error) {
    if (error instanceof Error && error.message === "Comment not found") {
      res.status(404).json({ error: "Comment not found" });
    } else {
      res.status(500).json({ error: "Failed to delete comment" });
    }
  }
};
