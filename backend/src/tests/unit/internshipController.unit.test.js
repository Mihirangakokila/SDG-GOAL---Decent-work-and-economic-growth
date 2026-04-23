/**
 * UNIT TESTS — internshipController.js
 *
 * All service calls and mongoose models are mocked. Tests cover the controller
 * layer only: req/res handling, delegation to service, error propagation.
 */

// ─── Mocks ────────────────────────────────────────────────────────────────────

jest.mock('../../services/internshipService.js', () => ({
  createInternship:           jest.fn(),
  updateInternship:           jest.fn(),
  deleteInternship:           jest.fn(),
  getInternshipByIdService:   jest.fn(),
  getMyInternshipsService:    jest.fn(),
  incrementViewCountService:  jest.fn(),
  getDashboardStatsService:   jest.fn(),
  searchInternshipsService:   jest.fn(),
  getNearbyInternshipsService: jest.fn(),
}));

jest.mock('../../models/YouthProfile.js', () => ({
  __esModule: true,
  default: { findOne: jest.fn() },
}));

// ─── Imports ──────────────────────────────────────────────────────────────────

import {
  createInternship,
  updateInternship,
  deleteInternship,
  getInternshipByIdService,
  getMyInternshipsService,
  incrementViewCountService,
  getDashboardStatsService,
  searchInternshipsService,
  getNearbyInternshipsService,
} from '../../services/internshipService.js';

import YouthProfile from '../../models/YouthProfile.js';

import {
  createInternshipController,
  updateInternshipController,
  deleteInternshipController,
  getInternshipByIdController,
  getMyInternships,
  incrementViewCountController,
  getDashboardStats,
  searchInternshipsController,
  getNearbyInternshipsController,
} from '../../controllers/internshipController.js';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const mockRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json   = jest.fn().mockReturnValue(res);
  return res;
};

const orgUser   = { _id: 'org456', id: 'org456', role: 'organization' };
const youthUser = { _id: 'youth123', id: 'youth123', role: 'youth' };

const fakeInternship = {
  _id: 'int001',
  tittle: 'React Intern',
  status: 'Active',
};

// ─── createInternshipController ───────────────────────────────────────────────

describe('internshipController — createInternshipController', () => {
  beforeEach(() => jest.clearAllMocks());

  test('returns 201 with created internship', async () => {
    createInternship.mockResolvedValue(fakeInternship);
    const req = { body: { tittle: 'React Intern' }, user: orgUser };
    const res = mockRes();

    await createInternshipController(req, res);

    expect(createInternship).toHaveBeenCalledWith(req.body, orgUser._id);
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(fakeInternship);
  });

  test('returns 500 on service error', async () => {
    createInternship.mockRejectedValue(new Error('Service error'));
    const req = { body: {}, user: orgUser };
    const res = mockRes();

    await createInternshipController(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ message: 'Service error' });
  });
});

// ─── updateInternshipController ───────────────────────────────────────────────

describe('internshipController — updateInternshipController', () => {
  beforeEach(() => jest.clearAllMocks());

  test('returns 200 with updated internship', async () => {
    const updated = { ...fakeInternship, tittle: 'Updated' };
    updateInternship.mockResolvedValue(updated);
    const req = { body: { tittle: 'Updated' }, params: { id: 'int001' }, user: orgUser };
    const res = mockRes();

    await updateInternshipController(req, res);

    expect(updateInternship).toHaveBeenCalledWith(req.body, 'int001', orgUser._id);
    expect(res.json).toHaveBeenCalledWith(updated);
  });

  test('returns 500 on service error', async () => {
    updateInternship.mockRejectedValue(new Error('Not found'));
    const req = { body: {}, params: { id: 'bad' }, user: orgUser };
    const res = mockRes();

    await updateInternshipController(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
  });
});

// ─── deleteInternshipController ───────────────────────────────────────────────

describe('internshipController — deleteInternshipController', () => {
  beforeEach(() => jest.clearAllMocks());

  test('returns 200 with success message', async () => {
    deleteInternship.mockResolvedValue(true);
    const req = { params: { id: 'int001' }, user: orgUser };
    const res = mockRes();

    await deleteInternshipController(req, res);

    expect(res.json).toHaveBeenCalledWith({ message: 'Internship deleted successfully' });
  });

  test('returns 500 on error', async () => {
    deleteInternship.mockRejectedValue(new Error('Cannot delete'));
    const req = { params: { id: 'int001' }, user: orgUser };
    const res = mockRes();

    await deleteInternshipController(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
  });
});

// ─── getInternshipByIdController ─────────────────────────────────────────────

describe('internshipController — getInternshipByIdController', () => {
  beforeEach(() => jest.clearAllMocks());

  test('returns internship correctly', async () => {
    getInternshipByIdService.mockResolvedValue(fakeInternship);
    const req = { params: { id: 'int001' } };
    const res = mockRes();

    await getInternshipByIdController(req, res);

    expect(res.json).toHaveBeenCalledWith(fakeInternship);
  });

  test('returns 500 if not found', async () => {
    getInternshipByIdService.mockRejectedValue(new Error('Not found'));
    const req = { params: { id: 'bad' } };
    const res = mockRes();

    await getInternshipByIdController(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
  });
});

// ─── getMyInternships ─────────────────────────────────────────────────────────

describe('internshipController — getMyInternships', () => {
  beforeEach(() => jest.clearAllMocks());

  test('passes status query param to service', async () => {
    getMyInternshipsService.mockResolvedValue([fakeInternship]);
    const req = { user: orgUser, query: { status: 'Active' } };
    const res = mockRes();

    await getMyInternships(req, res);

    expect(getMyInternshipsService).toHaveBeenCalledWith(orgUser._id, 'Active');
    expect(res.json).toHaveBeenCalledWith([fakeInternship]);
  });

  test('returns 500 on error', async () => {
    getMyInternshipsService.mockRejectedValue(new Error('err'));
    const req = { user: orgUser, query: {} };
    const res = mockRes();

    await getMyInternships(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
  });
});

// ─── incrementViewCountController ─────────────────────────────────────────────

describe('internshipController — incrementViewCountController', () => {
  beforeEach(() => jest.clearAllMocks());

  test('returns success with updated internship', async () => {
    incrementViewCountService.mockResolvedValue({ ...fakeInternship, viewCount: 1 });
    const req = { params: { id: 'int001' } };
    const res = mockRes();

    await incrementViewCountController(req, res);

    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ success: true }),
    );
  });

  test('returns 500 on error', async () => {
    incrementViewCountService.mockRejectedValue(new Error('err'));
    const req = { params: { id: 'bad' } };
    const res = mockRes();

    await incrementViewCountController(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: false }));
  });
});

// ─── getDashboardStats ────────────────────────────────────────────────────────

describe('internshipController — getDashboardStats', () => {
  beforeEach(() => jest.clearAllMocks());

  test('returns stats correctly', async () => {
    const stats = { totalInternships: 5, activeInternships: 3 };
    getDashboardStatsService.mockResolvedValue(stats);
    const req = { user: orgUser };
    const res = mockRes();

    await getDashboardStats(req, res);

    expect(res.json).toHaveBeenCalledWith({ success: true, data: stats });
  });

  test('returns 500 on error', async () => {
    getDashboardStatsService.mockRejectedValue(new Error('err'));
    const req = { user: orgUser };
    const res = mockRes();

    await getDashboardStats(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: false }));
  });
});

// ─── searchInternshipsController ─────────────────────────────────────────────

describe('internshipController — searchInternshipsController', () => {
  beforeEach(() => jest.clearAllMocks());

  test('returns search results', async () => {
    searchInternshipsService.mockResolvedValue([fakeInternship]);
    const req = { query: { keyword: 'React' } };
    const res = mockRes();

    await searchInternshipsController(req, res);

    expect(searchInternshipsService).toHaveBeenCalledWith({ keyword: 'React' });
    expect(res.json).toHaveBeenCalledWith({ success: true, data: [fakeInternship] });
  });

  test('returns 500 on service error', async () => {
    searchInternshipsService.mockRejectedValue(new Error('err'));
    const req = { query: {} };
    const res = mockRes();

    await searchInternshipsController(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
  });
});

// ─── getNearbyInternshipsController ──────────────────────────────────────────

describe('internshipController — getNearbyInternshipsController', () => {
  beforeEach(() => jest.clearAllMocks());

  test('returns empty + locationAvailable:false if profile missing coordinates', async () => {
    YouthProfile.findOne.mockReturnValue({
      select: jest.fn().mockResolvedValue(null),
    });

    const req = { user: youthUser, query: {} };
    const res = mockRes();

    await getNearbyInternshipsController(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ internships: [], locationAvailable: false });
  });

  test('returns nearby internships when profile has coordinates', async () => {
    YouthProfile.findOne.mockReturnValue({
      select: jest.fn().mockResolvedValue({
        coordinates: { coordinates: [80.0, 6.9] },
      }),
    });
    getNearbyInternshipsService.mockResolvedValue([fakeInternship]);

    const req = { user: youthUser, query: { radius: '30', limit: '5' } };
    const res = mockRes();

    await getNearbyInternshipsController(req, res);

    expect(getNearbyInternshipsService).toHaveBeenCalledWith(80.0, 6.9, 30, 5);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ locationAvailable: true, internships: [fakeInternship] }),
    );
  });

  test('returns 500 on error', async () => {
    YouthProfile.findOne.mockImplementation(() => { throw new Error('boom'); });
    const req = { user: youthUser, query: {} };
    const res = mockRes();

    await getNearbyInternshipsController(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
  });
});
