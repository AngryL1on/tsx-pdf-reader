import { http, HttpResponse, passthrough } from 'msw';
import type { CommentDto, CreateCommentBody } from '@/entities/comment/model/types';
import type { DocumentDto } from '@/entities/document/model/types';
import documentsSeed from '@/shared/mocks/data/documents.json';
import commentsSeed from '@/shared/mocks/data/comments.json';

const documents: DocumentDto[] = [...documentsSeed];
const comments: CommentDto[] = structuredClone(commentsSeed as CommentDto[]);

const defaultAuthor = { id: 'user-demo', name: 'Демо-пользователь' };

const findDocument = (id: string) => documents.find((item) => item.id === id);

const parseOptionalUser = (request: Request) => {
  const raw = request.headers.get('x-user-id');
  if (!raw) {
    return defaultAuthor;
  }
  const name = request.headers.get('x-user-name') ?? `Пользователь ${raw}`;
  return { id: raw, name };
};

export const handlers = [
  // Явный passthrough: статика из public/ не должна обрабатываться моками API.
  http.get('*/sample.pdf', () => passthrough()),
  http.get('/api/documents', () => HttpResponse.json(documents)),

  http.get('/api/documents/:documentId', ({ params }) => {
    const document = findDocument(String(params.documentId));
    if (!document) {
      return HttpResponse.json({ message: 'Документ не найден' }, { status: 404 });
    }
    return HttpResponse.json(document);
  }),

  http.get('/api/documents/:documentId/comments', ({ params }) => {
    const documentId = String(params.documentId);
    if (!findDocument(documentId)) {
      return HttpResponse.json({ message: 'Документ не найден' }, { status: 404 });
    }
    const list = comments.filter((item) => item.documentId === documentId);
    return HttpResponse.json(list);
  }),

  http.post('/api/documents/:documentId/comments', async ({ params, request }) => {
    const documentId = String(params.documentId);
    if (!findDocument(documentId)) {
      return HttpResponse.json({ message: 'Документ не найден' }, { status: 404 });
    }
    const body = (await request.json()) as Partial<CreateCommentBody>;
    if (
      typeof body.pageIndex !== 'number' ||
      typeof body.relX !== 'number' ||
      typeof body.relY !== 'number' ||
      typeof body.text !== 'string'
    ) {
      return HttpResponse.json({ message: 'Некорректное тело запроса' }, { status: 400 });
    }
    const author = parseOptionalUser(request);
    const comment: CommentDto = {
      id: `cmt-${crypto.randomUUID()}`,
      documentId,
      pageIndex: body.pageIndex,
      relX: body.relX,
      relY: body.relY,
      text: body.text.trim(),
      author,
      createdAt: new Date().toISOString(),
    };
    comments.push(comment);
    return HttpResponse.json(comment, { status: 201 });
  }),

  http.patch('/api/comments/:commentId', async ({ params, request }) => {
    const commentId = String(params.commentId);
    const index = comments.findIndex((item) => item.id === commentId);
    if (index === -1) {
      return HttpResponse.json({ message: 'Комментарий не найден' }, { status: 404 });
    }
    const body = (await request.json()) as { text?: string };
    if (typeof body.text !== 'string' || !body.text.trim()) {
      return HttpResponse.json({ message: 'Текст обязателен' }, { status: 400 });
    }
    const updated: CommentDto = {
      ...comments[index],
      text: body.text.trim(),
    };
    comments[index] = updated;
    return HttpResponse.json(updated);
  }),

  http.delete('/api/comments/:commentId', ({ params }) => {
    const commentId = String(params.commentId);
    const index = comments.findIndex((item) => item.id === commentId);
    if (index === -1) {
      return HttpResponse.json({ message: 'Комментарий не найден' }, { status: 404 });
    }
    comments.splice(index, 1);
    return new HttpResponse(null, { status: 204 });
  }),
];
