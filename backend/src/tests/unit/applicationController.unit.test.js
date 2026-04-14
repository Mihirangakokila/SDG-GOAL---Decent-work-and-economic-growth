/**
 * UNIT TESTS — applicationController.js
 *
 * All external dependencies (mongoose models, PDF parser, email, matching service)
 * are mocked so controller logic is validated in complete isolation.
 */

// ─── Mocks ────────────────────────────────────────────────────────────────────

jest.mock('../../models/Application.js', () => ({
  __esModule: true,
  default: {
    findOne:      jest.fn(),
    find:         jest.fn(),
    findById:     jest.fn(),
    create:       jest.fn(),
    findByIdAndUpdate: jest.fn(),
  },
}));

jest.mock('../../models/internship.js', () => ({
  __esModule: true,
  default: {
    findById:        jest.fn(),
    findByIdAndUpdate: jest.fn(),
  },
}));

jest.mock('../../models/User.js', () => ({
  __esModule: true,
  default: { findById: jest.fn() },
}));

jest.mock('../../services/matchingService.js', () => ({
  calculateEligibilityScore: jest.fn().mockResolvedValue({
    total: 75,
    breakdown: { skillMatch: 30, educationMatch: 20, locationMatch: 15, priorityBoost: 10 },
    aiReasoning: 'Good match',
  }),
}));

jest.mock('pdfjs-dist/legacy/build/pdf.mjs', () => ({
  getDocument: jest.fn().mockReturnValue({
    promise: Promise.resolve({
      numPages: 1,
      getPage: jest.fn().mockResolvedValue({
        getTextContent: jest.fn().mockResolvedValue({
          items: [{ str: 'JavaScript React Node.js Bachelor Degree Colombo' }],
        }),
      }),
    }),
  }),
}));

jest.mock('../../utils/emailService.js', () => ({
  sendNewApplicationNotification: jest.fn().mockResolvedValue(true),
}));

// Mock global fetch used by extractTextFromPDF helper
global.fetch = jest.fn().mockResolvedValue({
  ok: true,
  arrayBuffer: jest.fn().mockResolvedValue(new ArrayBuffer(8)),
});

// ─── Imports ──────────────────────────────────────────────────────────────────

import Application from '../../models/Application.js';
import Internship from '../../models/internship.js';
import User from '../../models/User.js';
import {
  getMyApplications,
  checkApplicationStatus,
  getApplicationById,
  withdrawApplication,
  getApplicationsByInternship,
} from '../../controllers/applicationController.js';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const mockRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json   = jest.fn().mockReturnValue(res);
  return res;
};

const youthUser = { id: 'youth123', _id: 'youth123', role: 'youth', profile: {} };
const orgUser   = { id: 'org456',   _id: 'org456',   role: 'organization' };
const adminUser = { id: 'admin789', _id: 'admin789', role: 'admin' };

const fakeInternship = {
  _id: 'int001',
  tittle: 'React Intern',
  status: 'Active',
  organizationId: 'org456',
  requiredSkills: ['React'],
  requiredEducation: 'Degree',
  location: 'Colombo',
};

const fakeApplication = {
  _id: 'app001',
  youthId: { _id: 'youth123', toString: () => 'youth123' },
  internshipId: 'int001',
  name: 'Alice',
  email: 'alice@example.com',
  phoneNumber: '0712345678',
  cvUrl: 'https://res.cloudinary.com/test/cv.pdf',
  status: 'Applied',
  eligibilityScore: 75,
  deleteOne: jest.fn().mockResolvedValue(true),
  save: jest.fn().mockResolvedValue(true),
};

// ─── getMyApplications ────────────────────────────────────────────────────────

describe('applicationController — getMyApplications', () => {
  beforeEach(() => jest.clearAllMocks());

  test('returns 200 with applications array', async () => {
    // Controller calls: Application.find().populate({ path, populate }).sort()
    // The nested populate option is an object, not a second .populate() call.
    const sortMock = jest.fn().mockResolvedValue([fakeApplication]);
    const populateMock = jest.fn().mockReturnValue({ sort: sortMock });
    Application.find.mockReturnValue({ populate: populateMock });

    const req = { user: youthUser };
    const res = mockRes();

    await getMyApplications(req, res);

    expect(Application.find).toHaveBeenCalledWith({ youthId: 'youth123' });
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ success: true, count: 1 }),
    );
  });

  test('returns 500 on db error', async () => {
    Application.find.mockImplementation(() => { throw new Error('DB error'); });
    const req = { user: youthUser };
    const res = mockRes();

    await getMyApplications(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
  });
});

// ─── checkApplicationStatus ───────────────────────────────────────────────────

describe('applicationController — checkApplicationStatus', () => {
  beforeEach(() => jest.clearAllMocks());

  test('returns hasApplied: true when application found', async () => {
    Application.findOne.mockResolvedValue(fakeApplication);
    const req = { user: youthUser, params: { internshipId: 'int001' } };
    const res = mockRes();

    await checkApplicationStatus(req, res);

    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ success: true, hasApplied: true }),
    );
  });

  test('returns hasApplied: false when application not found', async () => {
    Application.findOne.mockResolvedValue(null);
    const req = { user: youthUser, params: { internshipId: 'int001' } };
    const res = mockRes();

    await checkApplicationStatus(req, res);

    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ hasApplied: false, application: null }),
    );
  });

  test('returns 500 on error', async () => {
    Application.findOne.mockRejectedValue(new Error('fail'));
    const req = { user: youthUser, params: { internshipId: 'int001' } };
    const res = mockRes();

    await checkApplicationStatus(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
  });
});

// ─── getApplicationById ───────────────────────────────────────────────────────

describe('applicationController — getApplicationById', () => {
  beforeEach(() => jest.clearAllMocks());

  const buildPopulateChain = (app) => {
    const p2 = jest.fn().mockResolvedValue(app);
    const p1 = jest.fn().mockReturnValue({ populate: p2 });
    Application.findById.mockReturnValue({ populate: p1 });
  };

  test('returns 404 when application not found', async () => {
    const p2 = jest.fn().mockResolvedValue(null);
    const p1 = jest.fn().mockReturnValue({ populate: p2 });
    Application.findById.mockReturnValue({ populate: p1 });

    const req = { user: youthUser, params: { id: 'app001' } };
    const res = mockRes();

    await getApplicationById(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
  });

  test('returns 200 for the owner', async () => {
    buildPopulateChain(fakeApplication);
    const req = { user: youthUser, params: { id: 'app001' } };
    const res = mockRes();

    await getApplicationById(req, res);

    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ success: true }),
    );
  });

  test('returns 403 for non-owner non-privileged user', async () => {
    const otherApp = {
      ...fakeApplication,
      youthId: { _id: 'someoneElse', toString: () => 'someoneElse' },
    };
    buildPopulateChain(otherApp);

    const req = { user: youthUser, params: { id: 'app001' } };
    const res = mockRes();

    await getApplicationById(req, res);

    expect(res.status).toHaveBeenCalledWith(403);
  });

  test('admin can view any application', async () => {
    const otherApp = {
      ...fakeApplication,
      youthId: { _id: 'someoneElse', toString: () => 'someoneElse' },
    };
    buildPopulateChain(otherApp);

    const req = { user: adminUser, params: { id: 'app001' } };
    const res = mockRes();

    await getApplicationById(req, res);

    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
  });
});

// ─── withdrawApplication ──────────────────────────────────────────────────────

describe('applicationController — withdrawApplication', () => {
  beforeEach(() => jest.clearAllMocks());

  test('returns 404 if application not found', async () => {
    Application.findById.mockResolvedValue(null);
    const req = { user: youthUser, params: { id: 'app001' } };
    const res = mockRes();

    await withdrawApplication(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
  });

  test('returns 403 if user does not own the application', async () => {
    Application.findById.mockResolvedValue({
      ...fakeApplication,
      youthId: { toString: () => 'someoneElse' },
    });
    const req = { user: youthUser, params: { id: 'app001' } };
    const res = mockRes();

    await withdrawApplication(req, res);

    expect(res.status).toHaveBeenCalledWith(403);
  });

  test('returns 400 if application status is not "Applied"', async () => {
    Application.findById.mockResolvedValue({
      ...fakeApplication,
      youthId: { toString: () => 'youth123' },
      status: 'Accepted',
    });
    const req = { user: youthUser, params: { id: 'app001' } };
    const res = mockRes();

    await withdrawApplication(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ message: expect.stringMatching(/Cannot withdraw/i) }),
    );
  });

  test('returns 200 and deletes application successfully', async () => {
    const deleteOneMock = jest.fn().mockResolvedValue(true);
    Application.findById.mockResolvedValue({
      ...fakeApplication,
      youthId: { toString: () => 'youth123' },
      status: 'Applied',
      internshipId: 'int001',
      deleteOne: deleteOneMock,
    });
    Internship.findByIdAndUpdate.mockResolvedValue(true);

    const req = { user: youthUser, params: { id: 'app001' } };
    const res = mockRes();

    await withdrawApplication(req, res);

    expect(deleteOneMock).toHaveBeenCalled();
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ success: true, message: 'Application withdrawn successfully' }),
    );
  });
});

// ─── getApplicationsByInternship ──────────────────────────────────────────────

describe('applicationController — getApplicationsByInternship', () => {
  beforeEach(() => jest.clearAllMocks());

  test('returns 200 with applications list', async () => {
    const sortMock = jest.fn().mockResolvedValue([fakeApplication]);
    const selectMock = jest.fn().mockReturnValue({ sort: sortMock });
    Application.find.mockReturnValue({ select: selectMock });

    const req = { user: orgUser, params: { internshipId: 'int001' } };
    const res = mockRes();

    await getApplicationsByInternship(req, res);

    expect(Application.find).toHaveBeenCalledWith({ internshipId: 'int001' });
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ success: true }),
    );
  });

  test('returns 500 on error', async () => {
    Application.find.mockImplementation(() => { throw new Error('fail'); });
    const req = { user: orgUser, params: { internshipId: 'int001' } };
    const res = mockRes();

    await getApplicationsByInternship(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
  });
});
