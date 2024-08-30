import fs from "fs";

const asyncHandler = (fn) => async (req, res, next) => {
  try {
    await fn(req, res, next);
  } catch (error) {
    // if (error.localFilePaths && error.localFilePaths.length > 0) {
    //   error.localFilePaths.forEach((path) => {
    //     if (fs.existsSync(path)) {
    //       fs.unlinkSync(path);
    //     }
    //   });
    // }
    // res.status(error.status || 500).json({
    //   success: false,
    //   message: error.message || "Something went wrong",
    // });
    next(error);
  }
};

export default asyncHandler;
