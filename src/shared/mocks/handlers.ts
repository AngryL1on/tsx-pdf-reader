import { http, HttpResponse, passthrough } from 'msw';
import type {
  CommentDto,
  CreateCommentBody,
  HighlightRectDto,
  UpdateCommentBody,
} from '@/entities/comment/model/types';
import type { DocumentAttachmentDto } from '@/entities/document-attachment/model/types';
import type { DocumentDto } from '@/entities/document/model/types';
import { isValidHighlightColor } from '@/features/manage-comments/model/highlightColors';
import documentsSeed from '@/shared/mocks/data/documents.json';
import commentsSeed from '@/shared/mocks/data/comments.json';

const documents: DocumentDto[] = [...documentsSeed];
const comments: CommentDto[] = structuredClone(commentsSeed as CommentDto[]);

type StoredAttachment = DocumentAttachmentDto & { data: Uint8Array };
const attachments: StoredAttachment[] = [];

const MAX_ATTACHMENT_BYTES = 25 * 1024 * 1024;

const defaultAuthor = { id: 'user-demo', name: 'Демо-пользователь' };

const findDocument = (id: string) => documents.find((item) => item.id === id);

const findComment = (id: string) => comments.find((item) => item.id === id);

const isValidHighlightRect = (value: unknown): value is HighlightRectDto => {
  if (!value || typeof value !== 'object') {
    return false;
  }
  const r = value as HighlightRectDto;
  const nums = [r.relLeft, r.relTop, r.relWidth, r.relHeight];
  if (!nums.every((n) => typeof n === 'number' && Number.isFinite(n))) {
    return false;
  }
  if (nums.some((n) => n < 0 || n > 1)) {
    return false;
  }
  return r.relLeft + r.relWidth <= 1 + 1e-5 && r.relTop + r.relHeight <= 1 + 1e-5;
};

const parseOptionalUser = (request: Request) => {
  const raw = request.headers.get('x-user-id');
  if (!raw) {
    return defaultAuthor;
  }
  const name = request.headers.get('x-user-name') ?? `Пользователь ${raw}`;
  return { id: raw, name };
};

export const handlers = [
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
    if (typeof body.text !== 'string' || !body.text.trim()) {
      return HttpResponse.json({ message: 'Некорректное тело запроса' }, { status: 400 });
    }

    const author = parseOptionalUser(request);

    if (body.parentCommentId) {
      const parent = findComment(body.parentCommentId);
      if (!parent || parent.documentId !== documentId || parent.parentCommentId) {
        return HttpResponse.json({ message: 'Родительский комментарий не найден' }, { status: 400 });
      }
      const reply: CommentDto = {
        id: `cmt-${crypto.randomUUID()}`,
        documentId,
        pageIndex: parent.pageIndex,
        relX: parent.relX,
        relY: parent.relY,
        ...(parent.highlightColor ? { highlightColor: parent.highlightColor } : {}),
        text: body.text.trim(),
        author,
        createdAt: new Date().toISOString(),
        resolved: false,
        parentCommentId: parent.id,
      };
      comments.push(reply);
      return HttpResponse.json(reply, { status: 201 });
    }

    if (
      typeof body.pageIndex !== 'number' ||
      typeof body.relX !== 'number' ||
      typeof body.relY !== 'number'
    ) {
      return HttpResponse.json({ message: 'Некорректное тело запроса' }, { status: 400 });
    }

    let highlightRects: HighlightRectDto[] | undefined;
    if (body.highlightRects !== undefined) {
      if (!Array.isArray(body.highlightRects) || body.highlightRects.length === 0) {
        return HttpResponse.json({ message: 'Некорректное тело запроса' }, { status: 400 });
      }
      if (!body.highlightRects.every(isValidHighlightRect)) {
        return HttpResponse.json({ message: 'Некорректное тело запроса' }, { status: 400 });
      }
      highlightRects = body.highlightRects;
    }

    let highlightColor: string | undefined;
    if (body.highlightColor !== undefined) {
      if (typeof body.highlightColor !== 'string' || !isValidHighlightColor(body.highlightColor)) {
        return HttpResponse.json({ message: 'Некорректный цвет подсветки' }, { status: 400 });
      }
      highlightColor = body.highlightColor;
    }

    const comment: CommentDto = {
      id: `cmt-${crypto.randomUUID()}`,
      documentId,
      pageIndex: body.pageIndex,
      relX: body.relX,
      relY: body.relY,
      ...(highlightRects ? { highlightRects } : {}),
      ...(highlightColor ? { highlightColor } : {}),
      text: body.text.trim(),
      author,
      createdAt: new Date().toISOString(),
      resolved: false,
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
    const body = (await request.json()) as UpdateCommentBody;
    if (body.text !== undefined) {
      if (typeof body.text !== 'string' || !body.text.trim()) {
        return HttpResponse.json({ message: 'Текст обязателен' }, { status: 400 });
      }
    }
    if (body.resolved !== undefined && typeof body.resolved !== 'boolean') {
      return HttpResponse.json({ message: 'Некорректное тело запроса' }, { status: 400 });
    }
    if (body.text === undefined && body.resolved === undefined) {
      return HttpResponse.json({ message: 'Нечего обновлять' }, { status: 400 });
    }

    const current = comments[index];
    const updated: CommentDto = {
      ...current,
      ...(body.text !== undefined ? { text: body.text.trim() } : {}),
      ...(body.resolved !== undefined ? { resolved: body.resolved } : {}),
    };
    comments[index] = updated;

    if (body.resolved === true && !current.parentCommentId) {
      for (let i = 0; i < comments.length; i += 1) {
        if (comments[i].parentCommentId === commentId) {
          comments[i] = { ...comments[i], resolved: true };
        }
      }
    }

    return HttpResponse.json(updated);
  }),

  http.get('/api/documents/:documentId/attachments', ({ params }) => {
    const documentId = String(params.documentId);
    if (!findDocument(documentId)) {
      return HttpResponse.json({ message: 'Документ не найден' }, { status: 404 });
    }
    const list = attachments
      .filter((item) => item.documentId === documentId)
      .map(({ id, documentId: docId, filename, mimeType, sizeBytes, createdAt }) => ({
        id,
        documentId: docId,
        filename,
        mimeType,
        sizeBytes,
        createdAt,
      }));
    return HttpResponse.json(list);
  }),

  http.post('/api/documents/:documentId/attachments', async ({ params, request }) => {
    const documentId = String(params.documentId);
    if (!findDocument(documentId)) {
      return HttpResponse.json({ message: 'Документ не найден' }, { status: 404 });
    }
    const formData = await request.formData();
    const file = formData.get('file');
    if (!(file instanceof File)) {
      return HttpResponse.json({ message: 'Файл не передан' }, { status: 400 });
    }
    const isPdf =
      file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
    if (!isPdf) {
      return HttpResponse.json({ message: 'Допустимы только PDF' }, { status: 400 });
    }
    if (file.size > MAX_ATTACHMENT_BYTES) {
      return HttpResponse.json({ message: 'Файл больше 25 МБ' }, { status: 400 });
    }
    const data = new Uint8Array(await file.arrayBuffer());
    const item: StoredAttachment = {
      id: `att-${crypto.randomUUID()}`,
      documentId,
      filename: file.name,
      mimeType: file.type || 'application/pdf',
      sizeBytes: file.size,
      createdAt: new Date().toISOString(),
      data,
    };
    attachments.push(item);
    const { data: _data, ...dto } = item;
    return HttpResponse.json(dto, { status: 201 });
  }),

  http.get('/api/documents/:documentId/attachments/:attachmentId/file', ({ params }) => {
    const documentId = String(params.documentId);
    const attachmentId = String(params.attachmentId);
    const item = attachments.find(
      (entry) => entry.documentId === documentId && entry.id === attachmentId,
    );
    if (!item) {
      return HttpResponse.json({ message: 'Вложение не найдено' }, { status: 404 });
    }
    return new HttpResponse(item.data, {
      headers: {
        'Content-Type': item.mimeType,
        'Content-Disposition': `inline; filename="${encodeURIComponent(item.filename)}"`,
      },
    });
  }),

  http.delete('/api/documents/:documentId/attachments/:attachmentId', ({ params }) => {
    const documentId = String(params.documentId);
    const attachmentId = String(params.attachmentId);
    const index = attachments.findIndex(
      (entry) => entry.documentId === documentId && entry.id === attachmentId,
    );
    if (index === -1) {
      return HttpResponse.json({ message: 'Вложение не найдено' }, { status: 404 });
    }
    attachments.splice(index, 1);
    return new HttpResponse(null, { status: 204 });
  }),

  http.delete('/api/comments/:commentId', ({ params }) => {
    const commentId = String(params.commentId);
    const index = comments.findIndex((item) => item.id === commentId);
    if (index === -1) {
      return HttpResponse.json({ message: 'Комментарий не найден' }, { status: 404 });
    }
    const isRoot = !comments[index].parentCommentId;
    for (let i = comments.length - 1; i >= 0; i -= 1) {
      if (comments[i].id === commentId || (isRoot && comments[i].parentCommentId === commentId)) {
        comments.splice(i, 1);
      }
    }
    return new HttpResponse(null, { status: 204 });
  }),
];
