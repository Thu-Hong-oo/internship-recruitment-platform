const CandidateProfile = require('../../models/CandidateProfile');
const EmployerProfile = require('../../models/EmployerProfile');
const { ApiResponse } = require('../../utils/responseHandler');
const { AppError } = require('../../utils/errors');

const ensureCandidateProfile = async userId => {
  let profile = await CandidateProfile.findOne({ userId });
  if (!profile) {
    profile = await CandidateProfile.create({
      userId,
      personalInfo: { fullName: '', email: '', avatar: null },
      status: 'active',
      followedCompanies: [],
    });
  }
  if (!profile.followedCompanies) {
    profile.followedCompanies = [];
  }
  return profile;
};

class CompanyController {
  constructor() {
    // Bind all methods to preserve this context
    this.getCompanies = this.getCompanies.bind(this);
    this.handleCompanyAction = this.handleCompanyAction.bind(this);
  }

  // ============================================
  // COMPANIES MANAGEMENT
  // ============================================

  /**
   * GET /api/candidates/companies
   * Get companies data: following list or company detail
   * Query: ?type=following | ?id=xxx (detail)
   */
  async getCompanies(req, res, next) {
    try {
      const { type, id } = req.query;

      if (id) {
        return this._getCompanyDetail(id, req, res, next);
      }

      if (type === 'following') {
        return this._getFollowedCompanies(req, res, next);
      }

      throw new AppError(
        'Invalid query. Use ?type=following or ?id=companyId',
        400
      );
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/candidates/companies/:id/action
   * Handle company actions: follow, unfollow
   * Body: { action: "follow" | "unfollow" }
   */
  async handleCompanyAction(req, res, next) {
    try {
      const { id: companyId } = req.params;
      const { action } = req.body;

      switch (action) {
        case 'follow':
          return this._followCompany(companyId, req, res, next);
        case 'unfollow':
          return this._unfollowCompany(companyId, req, res, next);
        default:
          throw new AppError(
            'Invalid action. Must be: follow or unfollow',
            400
          );
      }
    } catch (error) {
      next(error);
    }
  }

  // ============================================
  // PRIVATE HELPER METHODS
  // ============================================

  /**
   * Follow company
   */
  async _followCompany(companyId, req, res, next) {
    try {
      // Check if company exists
      const company = await EmployerProfile.findById(companyId).select(
        'company stats status verification'
      );
      if (!company) {
        throw new AppError('Company not found', 404);
      }

      const profile = await ensureCandidateProfile(req.user.id);

      // Check if already following
      const alreadyFollowing = profile.followedCompanies.some(
        id => id.toString() === companyId
      );
      if (alreadyFollowing) {
        throw new AppError('Already following this company', 400);
      }

      profile.followedCompanies.push(companyId);
      await profile.save();

      const companySummary = {
        _id: company._id,
        name: company.company?.name,
        logo: company.company?.logo?.url,
        industry: company.company?.industry,
        size: company.company?.size,
        description: company.company?.description,
        website: company.company?.website,
        stats: company.stats,
        status: company.status,
      };

      return ApiResponse.success(
        res,
        {
          company: companySummary,
          isFollowing: true,
          totalFollowed: profile.followedCompanies.length,
        },
        'Company followed successfully'
      );
    } catch (error) {
      next(error);
    }
  }

  /**
   * Unfollow company
   */
  async _unfollowCompany(companyId, req, res, next) {
    try {
      const profile = await ensureCandidateProfile(req.user.id);

      const isFollowing = profile.followedCompanies.some(
        id => id.toString() === companyId
      );
      if (!isFollowing) {
        throw new AppError('Not following this company', 400);
      }

      profile.followedCompanies = profile.followedCompanies.filter(
        id => id.toString() !== companyId
      );
      await profile.save();

      return ApiResponse.success(
        res,
        {
          companyId,
          isFollowing: false,
          totalFollowed: profile.followedCompanies.length,
        },
        'Company unfollowed successfully'
      );
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get followed companies
   */
  async _getFollowedCompanies(req, res, next) {
    const { page = 1, limit = 10 } = req.query;

    const profile = await CandidateProfile.findOne({
      userId: req.user.id,
    }).populate({
      path: 'followedCompanies',
      select: 'company stats',
      options: {
        limit: limit * 1,
        skip: (page - 1) * limit,
      },
    });

    if (!profile) {
      throw new AppError('Candidate profile not found', 404);
    }

    const total = profile.followedCompanies
      ? profile.followedCompanies.length
      : 0;

    return ApiResponse.success(
      res,
      {
        companies: profile.followedCompanies || [],
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / limit),
          total,
          hasMore: page < Math.ceil(total / limit),
        },
      },
      'Followed companies retrieved successfully'
    );
  }

  /**
   * Get company detail
   */
  async _getCompanyDetail(companyId, req, res, next) {
    const company = await EmployerProfile.findById(companyId)
      .populate('userId', 'fullName email')
      .select('company verification stats status');

    if (!company) {
      throw new AppError('Company not found', 404);
    }

    let isFollowing = false;
    if (req.user?.role === 'candidate') {
      const profile = await CandidateProfile.findOne({
        userId: req.user.id,
      }).select('followedCompanies');
      if (profile?.followedCompanies?.length) {
        isFollowing = profile.followedCompanies.some(
          id => id.toString() === company._id.toString()
        );
      }
    }

    const companyData = {
      ...company.toObject(),
      isFollowing,
    };

    return ApiResponse.success(
      res,
      companyData,
      'Company details retrieved successfully'
    );
  }
}

module.exports = CompanyController;
