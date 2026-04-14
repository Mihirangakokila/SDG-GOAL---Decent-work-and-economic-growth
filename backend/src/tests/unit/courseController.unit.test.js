/**
 * UNIT TESTS — courseController.js
 *
 * Mongoose Course and CourseApplication models are mocked.
 * Tests exercise: validation, CRUD operations, ownership checks, error paths.
 */

// ─── Mocks ────────────────────────────────────────────────────────────────────

const mockLean     = jest.fn();
const mockSort     = jest.fn().mockReturnValue({ lean: mockLean });
const mockPopulate = jest.fn().mockReturnValue({ sort: mockSort, lean: mockLean });
const mockFind     = jest.fn().mockReturnValue({ populate: mockPopulate, sort: mockSort });

jest.mock('../../models/courseModel.js', () => {
  const Model = {
    find:        jest.fn(),
    findById:    jest.fn(),
    create:      jest.fn(),
    aggregate:   jest.fn(),
  };
  return { __esModule: true, default: Model };
});

jest.mock('../../models/applicationModel.js', () => ({
  __esModule: true,
  default: { aggregate: jest.fn() },
}));

// ─── Imports ──────────────────────────────────────────────────────────────────

import Course from '../../models/courseModel.js';
import CourseApplication from '../../models/applicationModel.js';
import {
  listCourses,
  createCourse,
  myCourses,
  updateCourse,
  deleteCourse,
} from '../../controllers/courseController.js';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const mockRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json   = jest.fn().mockReturnValue(res);
  return res;
};

const orgUser = { _id: 'org456', id: 'org456', role: 'organization' };

const fakeCourse = {
  _id: 'course001',
  title: 'JavaScript Basics',
  type: 'Online',
  location: '',
  description: 'Learn JS',
  link: 'https://example.com/js',
  organizerId: { toString: () => 'org456' },
  deleteOne: jest.fn().mockResolvedValue(true),
  save: jest.fn().mockResolvedValue(true),
};

// ─── listCourses ──────────────────────────────────────────────────────────────

describe('courseController — listCourses', () => {
  beforeEach(() => jest.clearAllMocks());

  test('returns 200 with courses array', async () => {
    const leanMock = jest.fn().mockResolvedValue([fakeCourse]);
    const sortMock = jest.fn().mockReturnValue({ lean: leanMock });
    const popMock  = jest.fn().mockReturnValue({ sort: sortMock });
    Course.find.mockReturnValue({ populate: popMock });

    const req = { query: {} };
    const res = mockRes();

    await listCourses(req, res);

    expect(Course.find).toHaveBeenCalled();
    expect(res.json).toHaveBeenCalledWith([fakeCourse]);
  });

  test('filters by type "Online"', async () => {
    const leanMock = jest.fn().mockResolvedValue([]);
    const sortMock = jest.fn().mockReturnValue({ lean: leanMock });
    const popMock  = jest.fn().mockReturnValue({ sort: sortMock });
    Course.find.mockReturnValue({ populate: popMock });

    const req = { query: { type: 'Online' } };
    const res = mockRes();

    await listCourses(req, res);

    const callArg = Course.find.mock.calls[0][0];
    expect(callArg.type).toBe('Online');
  });

  test('returns 500 on error', async () => {
    Course.find.mockImplementation(() => { throw new Error('DB fail'); });
    const req = { query: {} };
    const res = mockRes();

    await listCourses(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
  });
});

// ─── createCourse ─────────────────────────────────────────────────────────────

describe('courseController — createCourse', () => {
  beforeEach(() => jest.clearAllMocks());

  const validBody = {
    title: 'React Advanced',
    type: 'Online',
    link: 'https://example.com/react',
    description: 'Deep dive into React',
  };

  test('returns 400 if title is missing', async () => {
    const req = { body: { ...validBody, title: '' }, user: orgUser };
    const res = mockRes();

    await createCourse(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ message: 'Course name is required' }),
    );
  });

  test('returns 400 for invalid type', async () => {
    const req = { body: { ...validBody, type: 'InvalidType' }, user: orgUser };
    const res = mockRes();

    await createCourse(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ message: 'Type must be Online or Physical' }),
    );
  });

  test('returns 400 if Physical without location', async () => {
    const req = {
      body: { ...validBody, type: 'Physical', location: '' },
      user: orgUser,
    };
    const res = mockRes();

    await createCourse(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ message: 'Location is required for physical courses' }),
    );
  });

  test('returns 400 if link is missing', async () => {
    const req = { body: { ...validBody, link: '' }, user: orgUser };
    const res = mockRes();

    await createCourse(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ message: 'Course link is required' }),
    );
  });

  test('returns 400 if link is not a valid URL', async () => {
    const req = { body: { ...validBody, link: 'not-a-url' }, user: orgUser };
    const res = mockRes();

    await createCourse(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ message: 'Course link must be a valid http(s) URL' }),
    );
  });

  test('returns 201 with created course on valid input', async () => {
    Course.create.mockResolvedValue(fakeCourse);
    const leanMock = jest.fn().mockResolvedValue({ ...fakeCourse, organizerId: orgUser });
    const popMock  = jest.fn().mockReturnValue({ lean: leanMock });
    Course.findById.mockReturnValue({ populate: popMock });

    const req = { body: validBody, user: orgUser };
    const res = mockRes();

    await createCourse(req, res);

    expect(Course.create).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(201);
  });

  test('returns 201 for valid Physical course with location', async () => {
    Course.create.mockResolvedValue({ ...fakeCourse, type: 'Physical', location: 'Colombo' });
    const leanMock = jest.fn().mockResolvedValue({ ...fakeCourse, type: 'Physical' });
    const popMock  = jest.fn().mockReturnValue({ lean: leanMock });
    Course.findById.mockReturnValue({ populate: popMock });

    const req = {
      body: { ...validBody, type: 'Physical', location: 'Colombo' },
      user: orgUser,
    };
    const res = mockRes();

    await createCourse(req, res);

    expect(res.status).toHaveBeenCalledWith(201);
  });

  test('returns 500 on db error', async () => {
    Course.create.mockRejectedValue(new Error('DB fail'));
    const req = { body: validBody, user: orgUser };
    const res = mockRes();

    await createCourse(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
  });
});

// ─── myCourses ────────────────────────────────────────────────────────────────

describe('courseController — myCourses', () => {
  beforeEach(() => jest.clearAllMocks());

  test('returns empty array if no courses found', async () => {
    const leanMock = jest.fn().mockResolvedValue([]);
    const sortMock = jest.fn().mockReturnValue({ lean: leanMock });
    Course.find.mockReturnValue({ sort: sortMock });

    const req = { user: orgUser };
    const res = mockRes();

    await myCourses(req, res);

    expect(res.json).toHaveBeenCalledWith([]);
  });

  test('returns courses with application counts', async () => {
    const courses = [{ _id: 'course001', title: 'JS' }];
    const leanMock = jest.fn().mockResolvedValue(courses);
    const sortMock = jest.fn().mockReturnValue({ lean: leanMock });
    Course.find.mockReturnValue({ sort: sortMock });
    CourseApplication.aggregate.mockResolvedValue([{ _id: 'course001', applicationCount: 3 }]);

    const req = { user: orgUser };
    const res = mockRes();

    await myCourses(req, res);

    expect(res.json).toHaveBeenCalledWith([{ _id: 'course001', title: 'JS', applicationCount: 3 }]);
  });

  test('returns 500 on error', async () => {
    Course.find.mockImplementation(() => { throw new Error('fail'); });
    const req = { user: orgUser };
    const res = mockRes();

    await myCourses(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
  });
});

// ─── updateCourse ─────────────────────────────────────────────────────────────

describe('courseController — updateCourse', () => {
  beforeEach(() => jest.clearAllMocks());

  test('returns 404 if course not found', async () => {
    Course.findById.mockResolvedValue(null);
    const req = { params: { id: 'bad' }, body: {}, user: orgUser };
    const res = mockRes();

    await updateCourse(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
  });

  test('returns 403 if user does not own the course', async () => {
    Course.findById.mockResolvedValue({
      ...fakeCourse,
      organizerId: { toString: () => 'someone_else' },
    });
    const req = { params: { id: 'course001' }, body: {}, user: orgUser };
    const res = mockRes();

    await updateCourse(req, res);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ message: 'You can only edit your own courses' }),
    );
  });

  test('returns 400 for invalid type during update', async () => {
    Course.findById.mockResolvedValue({ ...fakeCourse });
    const req = { params: { id: 'course001' }, body: { type: 'BadType' }, user: orgUser };
    const res = mockRes();

    await updateCourse(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
  });

  test('returns 200 with updated course', async () => {
    const updatable = {
      ...fakeCourse,
      type: 'Online',
      save: jest.fn().mockResolvedValue(true),
    };
    Course.findById.mockResolvedValueOnce(updatable);

    const leanMock = jest.fn().mockResolvedValue({ ...updatable, title: 'New Title' });
    const popMock  = jest.fn().mockReturnValue({ lean: leanMock });
    Course.findById.mockReturnValueOnce({ populate: popMock });

    const req = {
      params: { id: 'course001' },
      body: { title: 'New Title' },
      user: orgUser,
    };
    const res = mockRes();

    await updateCourse(req, res);

    expect(updatable.save).toHaveBeenCalled();
    expect(res.json).toHaveBeenCalled();
  });
});

// ─── deleteCourse ─────────────────────────────────────────────────────────────

describe('courseController — deleteCourse', () => {
  beforeEach(() => jest.clearAllMocks());

  test('returns 404 if course not found', async () => {
    Course.findById.mockResolvedValue(null);
    const req = { params: { id: 'bad' }, user: orgUser };
    const res = mockRes();

    await deleteCourse(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
  });

  test('returns 403 if not owner', async () => {
    Course.findById.mockResolvedValue({
      ...fakeCourse,
      organizerId: { toString: () => 'someone_else' },
    });
    const req = { params: { id: 'course001' }, user: orgUser };
    const res = mockRes();

    await deleteCourse(req, res);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ message: 'You can only delete your own courses' }),
    );
  });

  test('returns 200 after deleting course', async () => {
    const deleteOneMock = jest.fn().mockResolvedValue(true);
    Course.findById.mockResolvedValue({ ...fakeCourse, deleteOne: deleteOneMock });

    const req = { params: { id: 'course001' }, user: orgUser };
    const res = mockRes();

    await deleteCourse(req, res);

    expect(deleteOneMock).toHaveBeenCalled();
    expect(res.json).toHaveBeenCalledWith({ message: 'Course deleted' });
  });

  test('returns 500 on error', async () => {
    Course.findById.mockRejectedValue(new Error('DB fail'));
    const req = { params: { id: 'course001' }, user: orgUser };
    const res = mockRes();

    await deleteCourse(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
  });
});
