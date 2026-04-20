export type CommentAuthorDto = {
  id: string;
  name: string;
};

export type CommentDto = {
  id: string;
  documentId: string;
  pageIndex: number;
  relX: number;
  relY: number;
  text: string;
  author: CommentAuthorDto;
  createdAt: string;
};

export type CreateCommentBody = {
  pageIndex: number;
  relX: number;
  relY: number;
  text: string;
};
