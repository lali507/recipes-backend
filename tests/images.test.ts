import { afterAll, beforeEach, describe, expect, it } from 'vitest';
import {
  FakeImageStorage,
  JPEG_BYTES,
  PNG_BYTES,
  createCategory,
  createRecipe,
  createUser,
  makeApi,
  prisma,
  resetDb,
} from './helpers';

let storage: FakeImageStorage;
let api: ReturnType<typeof makeApi>;

beforeEach(async () => {
  await resetDb();
  storage = new FakeImageStorage(true);
  api = makeApi(storage);
});
afterAll(() => prisma.$disconnect());

async function setup() {
  const me = await createUser();
  const category = await createCategory();
  const recipe = await createRecipe(me.user.id, category.id, { isPublic: true });
  return { me, category, recipe };
}

describe('recipe images', () => {
  it('uploads an image, stores the URL and hides the internal publicId', async () => {
    const { me, recipe } = await setup();
    const res = await api
      .post(`/api/recipes/${recipe.id}/image`)
      .set(me.auth)
      .attach('image', PNG_BYTES, { filename: 'cake.png', contentType: 'image/png' });
    expect(res.status).toBe(200);
    expect(res.body.imageUrl).toMatch(/^https:\/\/images\.example\.test\//);
    expect(res.body).not.toHaveProperty('imagePublicId');
    expect(storage.uploads).toHaveLength(1);
    expect(storage.uploads[0]?.mimeType).toBe('image/png');

    const stored = await prisma.recipe.findUniqueOrThrow({ where: { id: recipe.id } });
    expect(stored.imagePublicId).toBe(storage.uploads[0]?.publicId);
  });

  it('replacing an image deletes the old one from storage', async () => {
    const { me, recipe } = await setup();
    await api.post(`/api/recipes/${recipe.id}/image`).set(me.auth).attach('image', PNG_BYTES, { filename: 'a.png', contentType: 'image/png' });
    await api.post(`/api/recipes/${recipe.id}/image`).set(me.auth).attach('image', JPEG_BYTES, { filename: 'b.jpg', contentType: 'image/jpeg' });
    expect(storage.uploads).toHaveLength(2);
    expect(storage.deleted).toEqual([storage.uploads[0]?.publicId]);
  });

  it('removes an image', async () => {
    const { me, recipe } = await setup();
    await api.post(`/api/recipes/${recipe.id}/image`).set(me.auth).attach('image', PNG_BYTES, { filename: 'a.png', contentType: 'image/png' });
    const res = await api.delete(`/api/recipes/${recipe.id}/image`).set(me.auth);
    expect(res.status).toBe(200);
    expect(res.body.imageUrl).toBeNull();
    expect(storage.deleted).toHaveLength(1);
  });

  it('deleting a recipe also deletes its image from storage', async () => {
    const { me, recipe } = await setup();
    await api.post(`/api/recipes/${recipe.id}/image`).set(me.auth).attach('image', PNG_BYTES, { filename: 'a.png', contentType: 'image/png' });
    await api.delete(`/api/recipes/${recipe.id}`).set(me.auth);
    expect(storage.deleted).toEqual([storage.uploads[0]?.publicId]);
  });

  it('only the owner can upload (403 for public recipe of another, 404 for private)', async () => {
    const { recipe, category } = await setup();
    const stranger = await createUser();
    const owner2 = await createUser();
    const secret = await createRecipe(owner2.user.id, category.id, { isPublic: false });

    const onPublic = await api
      .post(`/api/recipes/${recipe.id}/image`)
      .set(stranger.auth)
      .attach('image', PNG_BYTES, { filename: 'a.png', contentType: 'image/png' });
    expect(onPublic.status).toBe(403);

    const onPrivate = await api
      .post(`/api/recipes/${secret.id}/image`)
      .set(stranger.auth)
      .attach('image', PNG_BYTES, { filename: 'a.png', contentType: 'image/png' });
    expect(onPrivate.status).toBe(404);

    expect((await api.delete(`/api/recipes/${recipe.id}/image`).set(stranger.auth)).status).toBe(403);
    expect(storage.uploads).toHaveLength(0);
  });

  it('rejects a disallowed file type (415)', async () => {
    const { me, recipe } = await setup();
    const res = await api
      .post(`/api/recipes/${recipe.id}/image`)
      .set(me.auth)
      .attach('image', Buffer.from('hello'), { filename: 'notes.txt', contentType: 'text/plain' });
    expect(res.status).toBe(415);
    expect(res.body.error.code).toBe('UNSUPPORTED_FILE_TYPE');
  });

  it('rejects a fake image whose content is not really an image (415)', async () => {
    const { me, recipe } = await setup();
    const res = await api
      .post(`/api/recipes/${recipe.id}/image`)
      .set(me.auth)
      .attach('image', Buffer.from('this is not a png'), { filename: 'fake.png', contentType: 'image/png' });
    expect(res.status).toBe(415);
    expect(storage.uploads).toHaveLength(0);
  });

  it('rejects files larger than 5MB (413)', async () => {
    const { me, recipe } = await setup();
    const big = Buffer.concat([PNG_BYTES, Buffer.alloc(5 * 1024 * 1024 + 10)]);
    const res = await api
      .post(`/api/recipes/${recipe.id}/image`)
      .set(me.auth)
      .attach('image', big, { filename: 'big.png', contentType: 'image/png' });
    expect(res.status).toBe(413);
    expect(res.body.error.code).toBe('FILE_TOO_LARGE');
  });

  it('returns 400 when no file is sent or the field name is wrong', async () => {
    const { me, recipe } = await setup();
    const none = await api.post(`/api/recipes/${recipe.id}/image`).set(me.auth).field('x', 'y');
    expect(none.status).toBe(400);
    const wrongField = await api
      .post(`/api/recipes/${recipe.id}/image`)
      .set(me.auth)
      .attach('photo', PNG_BYTES, { filename: 'a.png', contentType: 'image/png' });
    expect(wrongField.status).toBe(400);
  });

  it('returns 503 when Cloudinary is not configured', async () => {
    const unconfiguredApi = makeApi(new FakeImageStorage(false));
    const { me, recipe } = await setup();
    const res = await unconfiguredApi
      .post(`/api/recipes/${recipe.id}/image`)
      .set(me.auth)
      .attach('image', PNG_BYTES, { filename: 'a.png', contentType: 'image/png' });
    expect(res.status).toBe(503);
    expect(res.body.error.code).toBe('IMAGE_STORAGE_NOT_CONFIGURED');
  });
});
