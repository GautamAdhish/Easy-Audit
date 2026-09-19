/**
 * Small, dependency-free query builder shared by every "list" endpoint
 * (GET /api/audits, /api/findings, /api/risks, ...).
 *
 * Supported query string conventions:
 *   ?status=Open&department=IT     -> exact-match filters
 *   ?search=patch                  -> case-insensitive regex search across `searchFields`
 *   ?sort=-createdAt,title         -> sort (comma separated, "-" prefix = descending)
 *   ?fields=title,status           -> field selection (comma separated)
 *   ?page=2&limit=25               -> pagination (default limit 50, max 200)
 */
class APIFeatures {
  constructor(query, queryString, searchFields = []) {
    this.query = query;
    this.queryString = queryString;
    this.searchFields = searchFields;
  }

  filter() {
    const excluded = ["page", "sort", "limit", "fields", "search"];
    const queryObj = { ...this.queryString };
    excluded.forEach((field) => delete queryObj[field]);

    // Drop empty-string / "All" filter values coming from the frontend's
    // "All" dropdown option so they don't over-constrain the query.
    Object.keys(queryObj).forEach((key) => {
      if (queryObj[key] === "" || queryObj[key] === "All") delete queryObj[key];
    });

    this.query = this.query.find(queryObj);
    return this;
  }

  search() {
    const { search } = this.queryString;
    if (search && this.searchFields.length > 0) {
      const regex = new RegExp(
        search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
        "i",
      );
      this.query = this.query.find({
        $or: this.searchFields.map((field) => ({ [field]: regex })),
      });
    }
    return this;
  }

  sort() {
    if (this.queryString.sort) {
      const sortBy = this.queryString.sort.split(",").join(" ");
      this.query = this.query.sort(sortBy);
    } else {
      this.query = this.query.sort("-createdAt");
    }
    return this;
  }

  limitFields() {
    if (this.queryString.fields) {
      const fields = this.queryString.fields.split(",").join(" ");
      this.query = this.query.select(fields);
    } else {
      this.query = this.query.select("-__v");
    }
    return this;
  }

  paginate() {
    const page = Math.max(parseInt(this.queryString.page, 10) || 1, 1);
    const limit = Math.min(parseInt(this.queryString.limit, 10) || 50, 200);
    const skip = (page - 1) * limit;

    this.query = this.query.skip(skip).limit(limit);
    this.pagination = { page, limit };
    return this;
  }
}

export default APIFeatures;
