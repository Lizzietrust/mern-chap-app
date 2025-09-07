import User from "../models/UserModel.js";

export const fetchAllUsers = async (req, res, next) => {
    try {
      const { search, page = 1, limit = 10 } = req.query;
      let query = {};
  
      if (search) {
        const searchRegex = new RegExp(search, "i");
        query = {
          $or: [
            { firstName: searchRegex },
            { lastName: searchRegex },
            { email: searchRegex },
          ],
        };
      }
  
      const users = await User.find(query)
        .limit(limit * 1)
        .skip((page - 1) * limit)
        .exec();

      const totalUsers = await User.countDocuments(query);
  
      res.status(200).json({ users, totalUsers });
    } catch (error) {
      console.log({ error });
      next(error);
      return res.status(500).json({ message: "Internal Server Error" });
    }
  };