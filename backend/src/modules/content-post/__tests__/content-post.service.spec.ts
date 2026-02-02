import { Test, TestingModule } from '@nestjs/testing';
import { ContentPostService } from '../application/services/content-post.service';
import { PrismaService } from '../../../infrastructure/persistence/prisma.service';
import { createPrismaMock } from '../../../test-utils/prisma.mock';
import {
  CONTENT_POST_REPOSITORY,
  type IContentPostRepository,
} from '../domain/interfaces/content-post.repository.interface';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { ContentPostStatus, UserRole } from '@prisma/client';

describe('ContentPostService', () => {
  let service: ContentPostService;
  let repository: Partial<Record<keyof IContentPostRepository, jest.Mock>>;
  let prisma: ReturnType<typeof createPrismaMock>;

  const mockUser = { sub: 'user-1', role: UserRole.SUPER_ADMIN };

  const now = new Date('2026-01-15T10:00:00Z');

  const mockPost = (overrides: Record<string, unknown> = {}) => ({
    id: 'post-1',
    mediaPlanItemId: 'item-1',
    title: 'Test Post',
    content: 'Post content body',
    postType: 'IMAGE',
    status: ContentPostStatus.DRAFT,
    scheduledDate: new Date('2026-02-01'),
    publishedDate: null as Date | null,
    postUrl: null as string | null,
    assignee: {
      id: 'user-2',
      name: 'Assignee User',
      email: 'assignee@test.com',
      avatar: null,
    },
    assigneeId: 'user-2',
    notes: 'Some notes',
    orderIndex: 0,
    createdById: 'user-1',
    createdBy: { id: 'user-1', name: 'Creator', email: 'creator@test.com' },
    revisions: [] as Array<{
      id: string;
      contentPostId: string;
      title: string;
      content: string | null;
      revisionNote: string | null;
      revisedById: string;
      createdAt: Date;
    }>,
    _count: { files: 0 },
    createdAt: now,
    updatedAt: now,
    ...overrides,
  });

  const mockProject = (overrides: Record<string, unknown> = {}) => ({
    id: 'project-1',
    team: [{ userId: 'user-1', role: UserRole.PM }],
    ...overrides,
  });

  const mockPlan = (overrides: Record<string, unknown> = {}) => ({
    id: 'plan-1',
    projectId: 'project-1',
    ...overrides,
  });

  const mockItem = (overrides: Record<string, unknown> = {}) => ({
    id: 'item-1',
    mediaPlanId: 'plan-1',
    ...overrides,
  });

  beforeEach(async () => {
    prisma = createPrismaMock();
    repository = {
      findAll: jest.fn(),
      findById: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      createRevision: jest.fn(),
      reorder: jest.fn(),
      duplicate: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ContentPostService,
        { provide: PrismaService, useValue: prisma },
        { provide: CONTENT_POST_REPOSITORY, useValue: repository },
      ],
    }).compile();

    service = module.get<ContentPostService>(ContentPostService);

    // Default checkAccess mocks - project with team member, plan, and item all valid
    prisma.project.findUnique.mockResolvedValue(mockProject());
    prisma.mediaPlan.findFirst.mockResolvedValue(mockPlan());
    prisma.mediaPlanItem.findFirst.mockResolvedValue(mockItem());
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('findAll', () => {
    it('should return paginated list with default pagination', async () => {
      const posts = [
        mockPost(),
        mockPost({ id: 'post-2', title: 'Second Post', orderIndex: 1 }),
      ];
      repository.findAll!.mockResolvedValue({ data: posts, total: 2 });

      const result = await service.findAll(
        'project-1',
        'plan-1',
        'item-1',
        {},
        mockUser,
      );

      expect(repository.findAll).toHaveBeenCalledWith(
        expect.objectContaining({
          mediaPlanItemId: 'item-1',
          page: 1,
          limit: 50,
          sortBy: 'orderIndex',
          sortOrder: 'asc',
        }),
      );
      expect(result.data).toHaveLength(2);
      expect(result.total).toBe(2);
      expect(result.page).toBe(1);
      expect(result.limit).toBe(50);
      expect(result.totalPages).toBe(1);
      // Verify response mapping (dates are ISO strings)
      expect(result.data[0].scheduledDate).toBe('2026-02-01T00:00:00.000Z');
      expect(result.data[0].createdAt).toBe(now.toISOString());
    });

    it('should filter by status when provided', async () => {
      repository.findAll!.mockResolvedValue({ data: [mockPost()], total: 1 });

      await service.findAll(
        'project-1',
        'plan-1',
        'item-1',
        { status: ContentPostStatus.DRAFT },
        mockUser,
      );

      expect(repository.findAll).toHaveBeenCalledWith(
        expect.objectContaining({
          mediaPlanItemId: 'item-1',
          status: ContentPostStatus.DRAFT,
        }),
      );
    });
  });

  describe('findById', () => {
    it('should return post with relations', async () => {
      const post = mockPost({
        revisions: [
          {
            id: 'rev-1',
            contentPostId: 'post-1',
            title: 'Old Title',
            content: 'Old content',
            revisionNote: 'Needs changes',
            revisedById: 'user-1',
            createdAt: now,
          },
        ],
        _count: { files: 3 },
      });
      repository.findById!.mockResolvedValue(post);

      const result = await service.findById(
        'project-1',
        'plan-1',
        'item-1',
        'post-1',
        mockUser,
      );

      expect(repository.findById).toHaveBeenCalledWith('post-1');
      expect(result.id).toBe('post-1');
      expect(result.title).toBe('Test Post');
      expect(result.assignee).toEqual({
        id: 'user-2',
        name: 'Assignee User',
        email: 'assignee@test.com',
        avatar: null,
      });
      expect(result.revisions).toHaveLength(1);
      expect(result.revisions[0].revisionNote).toBe('Needs changes');
      expect(result.fileCount).toBe(3);
    });

    it('should throw NotFoundException when post not found', async () => {
      repository.findById!.mockResolvedValue(null);

      await expect(
        service.findById('project-1', 'plan-1', 'item-1', 'post-999', mockUser),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException when post belongs to different item', async () => {
      repository.findById!.mockResolvedValue(
        mockPost({ mediaPlanItemId: 'other-item' }),
      );

      await expect(
        service.findById('project-1', 'plan-1', 'item-1', 'post-1', mockUser),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('create', () => {
    it('should create post and return mapped response', async () => {
      const dto = {
        title: 'New Post',
        content: 'New content',
        postType: 'VIDEO',
        scheduledDate: '2026-03-01T00:00:00.000Z',
        assigneeId: 'user-2',
        notes: 'Important note',
      };
      const createdPost = mockPost({
        title: 'New Post',
        content: 'New content',
        postType: 'VIDEO',
        scheduledDate: new Date('2026-03-01'),
      });
      repository.create!.mockResolvedValue(createdPost);

      const result = await service.create(
        'project-1',
        'plan-1',
        'item-1',
        dto as any,
        mockUser,
      );

      expect(repository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          mediaPlanItemId: 'item-1',
          title: 'New Post',
          content: 'New content',
          postType: 'VIDEO',
          scheduledDate: expect.any(Date),
          assigneeId: 'user-2',
          notes: 'Important note',
          createdById: 'user-1',
        }),
      );
      expect(result.title).toBe('New Post');
      expect(result.postType).toBe('VIDEO');
    });

    it('should handle optional fields (no scheduledDate)', async () => {
      const dto = {
        title: 'Simple Post',
        postType: 'TEXT',
      };
      const createdPost = mockPost({
        title: 'Simple Post',
        postType: 'TEXT',
        scheduledDate: null,
        assignee: null,
        assigneeId: null,
        notes: null,
      });
      repository.create!.mockResolvedValue(createdPost);

      const result = await service.create(
        'project-1',
        'plan-1',
        'item-1',
        dto as any,
        mockUser,
      );

      expect(repository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          mediaPlanItemId: 'item-1',
          title: 'Simple Post',
          postType: 'TEXT',
          scheduledDate: undefined,
          createdById: 'user-1',
        }),
      );
      expect(result.scheduledDate).toBeNull();
    });
  });

  describe('update', () => {
    it('should update post fields and return mapped response', async () => {
      const existing = mockPost();
      const updated = mockPost({
        title: 'Updated Title',
        content: 'Updated content',
      });
      repository.findById!.mockResolvedValue(existing);
      repository.update!.mockResolvedValue(updated);

      const result = await service.update(
        'project-1',
        'plan-1',
        'item-1',
        'post-1',
        { title: 'Updated Title', content: 'Updated content' } as any,
        mockUser,
      );

      expect(repository.findById).toHaveBeenCalledWith('post-1');
      expect(repository.update).toHaveBeenCalledWith(
        'post-1',
        expect.objectContaining({
          title: 'Updated Title',
          content: 'Updated content',
        }),
      );
      expect(result.title).toBe('Updated Title');
      expect(result.content).toBe('Updated content');
    });

    it('should throw NotFoundException when post not found', async () => {
      repository.findById!.mockResolvedValue(null);

      await expect(
        service.update(
          'project-1',
          'plan-1',
          'item-1',
          'post-999',
          { title: 'Updated' } as any,
          mockUser,
        ),
      ).rejects.toThrow(NotFoundException);
      expect(repository.update).not.toHaveBeenCalled();
    });

    it('should handle scheduledDate conversion to Date or null', async () => {
      const existing = mockPost();
      const updated = mockPost({ scheduledDate: null });
      repository.findById!.mockResolvedValue(existing);
      repository.update!.mockResolvedValue(updated);

      await service.update(
        'project-1',
        'plan-1',
        'item-1',
        'post-1',
        { scheduledDate: null } as any,
        mockUser,
      );

      expect(repository.update).toHaveBeenCalledWith(
        'post-1',
        expect.objectContaining({ scheduledDate: null }),
      );
    });
  });

  describe('delete', () => {
    it('should delete post successfully', async () => {
      repository.findById!.mockResolvedValue(mockPost());
      repository.delete!.mockResolvedValue(undefined);

      await service.delete('project-1', 'plan-1', 'item-1', 'post-1', mockUser);

      expect(repository.findById).toHaveBeenCalledWith('post-1');
      expect(repository.delete).toHaveBeenCalledWith('post-1');
    });

    it('should throw NotFoundException when post not found', async () => {
      repository.findById!.mockResolvedValue(null);

      await expect(
        service.delete('project-1', 'plan-1', 'item-1', 'post-999', mockUser),
      ).rejects.toThrow(NotFoundException);
      expect(repository.delete).not.toHaveBeenCalled();
    });
  });

  describe('changeStatus', () => {
    it('should perform valid transition DRAFT -> REVIEW', async () => {
      const existing = mockPost({ status: ContentPostStatus.DRAFT });
      const updated = mockPost({ status: ContentPostStatus.REVIEW });
      repository.findById!.mockResolvedValue(existing);
      repository.update!.mockResolvedValue(updated);

      const result = await service.changeStatus(
        'project-1',
        'plan-1',
        'item-1',
        'post-1',
        ContentPostStatus.REVIEW,
        undefined,
        mockUser,
      );

      expect(repository.update).toHaveBeenCalledWith(
        'post-1',
        expect.objectContaining({ status: ContentPostStatus.REVIEW }),
      );
      expect(result.status).toBe(ContentPostStatus.REVIEW);
    });

    it('should throw BadRequestException for invalid transition DRAFT -> PUBLISHED', async () => {
      const existing = mockPost({ status: ContentPostStatus.DRAFT });
      repository.findById!.mockResolvedValue(existing);

      await expect(
        service.changeStatus(
          'project-1',
          'plan-1',
          'item-1',
          'post-1',
          ContentPostStatus.PUBLISHED,
          undefined,
          mockUser,
        ),
      ).rejects.toThrow(BadRequestException);
      expect(repository.update).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException for invalid transition PUBLISHED -> DRAFT', async () => {
      const existing = mockPost({ status: ContentPostStatus.PUBLISHED });
      repository.findById!.mockResolvedValue(existing);

      await expect(
        service.changeStatus(
          'project-1',
          'plan-1',
          'item-1',
          'post-1',
          ContentPostStatus.DRAFT,
          undefined,
          mockUser,
        ),
      ).rejects.toThrow(BadRequestException);
      expect(repository.update).not.toHaveBeenCalled();
    });

    it('should create revision snapshot when status changes to REVISION_REQUESTED', async () => {
      const existing = mockPost({ status: ContentPostStatus.REVIEW });
      const updated = mockPost({
        status: ContentPostStatus.REVISION_REQUESTED,
      });
      repository.findById!.mockResolvedValue(existing);
      repository.createRevision!.mockResolvedValue({ id: 'rev-1' });
      repository.update!.mockResolvedValue(updated);

      await service.changeStatus(
        'project-1',
        'plan-1',
        'item-1',
        'post-1',
        ContentPostStatus.REVISION_REQUESTED,
        'Please fix the title',
        mockUser,
      );

      expect(repository.createRevision).toHaveBeenCalledWith({
        contentPostId: 'post-1',
        title: 'Test Post',
        content: 'Post content body',
        revisionNote: 'Please fix the title',
        revisedById: 'user-1',
      });
      expect(repository.update).toHaveBeenCalledWith(
        'post-1',
        expect.objectContaining({
          status: ContentPostStatus.REVISION_REQUESTED,
        }),
      );
    });

    it('should NOT create revision for other status transitions', async () => {
      const existing = mockPost({ status: ContentPostStatus.DRAFT });
      const updated = mockPost({ status: ContentPostStatus.REVIEW });
      repository.findById!.mockResolvedValue(existing);
      repository.update!.mockResolvedValue(updated);

      await service.changeStatus(
        'project-1',
        'plan-1',
        'item-1',
        'post-1',
        ContentPostStatus.REVIEW,
        undefined,
        mockUser,
      );

      expect(repository.createRevision).not.toHaveBeenCalled();
    });

    it('should auto-set publishedDate when status changes to PUBLISHED', async () => {
      const existing = mockPost({
        status: ContentPostStatus.SCHEDULED,
        publishedDate: null,
      });
      const updated = mockPost({
        status: ContentPostStatus.PUBLISHED,
        publishedDate: new Date(),
      });
      repository.findById!.mockResolvedValue(existing);
      repository.update!.mockResolvedValue(updated);

      await service.changeStatus(
        'project-1',
        'plan-1',
        'item-1',
        'post-1',
        ContentPostStatus.PUBLISHED,
        undefined,
        mockUser,
      );

      expect(repository.update).toHaveBeenCalledWith(
        'post-1',
        expect.objectContaining({
          status: ContentPostStatus.PUBLISHED,
          publishedDate: expect.any(Date),
        }),
      );
    });

    it('should NOT override existing publishedDate when transitioning to PUBLISHED', async () => {
      const existingPublishedDate = new Date('2026-01-10');
      const existing = mockPost({
        status: ContentPostStatus.SCHEDULED,
        publishedDate: existingPublishedDate,
      });
      const updated = mockPost({
        status: ContentPostStatus.PUBLISHED,
        publishedDate: existingPublishedDate,
      });
      repository.findById!.mockResolvedValue(existing);
      repository.update!.mockResolvedValue(updated);

      await service.changeStatus(
        'project-1',
        'plan-1',
        'item-1',
        'post-1',
        ContentPostStatus.PUBLISHED,
        undefined,
        mockUser,
      );

      // Should only have status, not publishedDate since it already existed
      expect(repository.update).toHaveBeenCalledWith('post-1', {
        status: ContentPostStatus.PUBLISHED,
      });
    });

    it('should throw NotFoundException when post not found', async () => {
      repository.findById!.mockResolvedValue(null);

      await expect(
        service.changeStatus(
          'project-1',
          'plan-1',
          'item-1',
          'post-999',
          ContentPostStatus.REVIEW,
          undefined,
          mockUser,
        ),
      ).rejects.toThrow(NotFoundException);
      expect(repository.update).not.toHaveBeenCalled();
    });
  });

  describe('duplicate', () => {
    it('should copy post to target item within the same media plan', async () => {
      const existing = mockPost();
      const duplicated = mockPost({
        id: 'post-dup',
        mediaPlanItemId: 'item-2',
        status: ContentPostStatus.DRAFT,
      });
      repository.findById!.mockResolvedValue(existing);
      repository.duplicate!.mockResolvedValue(duplicated);

      // Mock getMediaPlanIdForItem - called to verify target belongs to same plan
      prisma.mediaPlanItem.findUnique.mockResolvedValue(
        mockItem({ id: 'item-2', mediaPlanId: 'plan-1' }),
      );

      const result = await service.duplicate(
        'project-1',
        'plan-1',
        'item-1',
        'post-1',
        'item-2',
        mockUser,
      );

      expect(repository.duplicate).toHaveBeenCalledWith(
        'post-1',
        'item-2',
        'user-1',
      );
      expect(result.id).toBe('post-dup');
      expect(result.mediaPlanItemId).toBe('item-2');
    });

    it('should throw BadRequestException when target item belongs to different plan', async () => {
      const existing = mockPost();
      repository.findById!.mockResolvedValue(existing);

      // getMediaPlanIdForItem for source item returns plan-1
      // target item belongs to plan-2 (different plan)
      prisma.mediaPlanItem.findUnique.mockImplementation(({ where }: any) => {
        if (where.id === 'item-2') {
          return Promise.resolve(
            mockItem({ id: 'item-2', mediaPlanId: 'plan-2' }),
          );
        }
        // For getMediaPlanIdForItem(itemId) call
        return Promise.resolve(
          mockItem({ id: 'item-1', mediaPlanId: 'plan-1' }),
        );
      });

      await expect(
        service.duplicate(
          'project-1',
          'plan-1',
          'item-1',
          'post-1',
          'item-2',
          mockUser,
        ),
      ).rejects.toThrow(BadRequestException);
      expect(repository.duplicate).not.toHaveBeenCalled();
    });

    it('should throw NotFoundException when source post not found', async () => {
      repository.findById!.mockResolvedValue(null);

      await expect(
        service.duplicate(
          'project-1',
          'plan-1',
          'item-1',
          'post-999',
          'item-2',
          mockUser,
        ),
      ).rejects.toThrow(NotFoundException);
      expect(repository.duplicate).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException when target item not found', async () => {
      const existing = mockPost();
      repository.findById!.mockResolvedValue(existing);

      prisma.mediaPlanItem.findUnique.mockImplementation(({ where }: any) => {
        if (where.id === 'item-missing') {
          return Promise.resolve(null);
        }
        return Promise.resolve(
          mockItem({ id: 'item-1', mediaPlanId: 'plan-1' }),
        );
      });

      await expect(
        service.duplicate(
          'project-1',
          'plan-1',
          'item-1',
          'post-1',
          'item-missing',
          mockUser,
        ),
      ).rejects.toThrow(BadRequestException);
      expect(repository.duplicate).not.toHaveBeenCalled();
    });
  });
});
