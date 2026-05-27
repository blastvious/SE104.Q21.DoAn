import Joi from "joi";

const maHS = Joi.string().max(10).required().messages({
  "string.empty": "Mã học sinh không được để trống",
  "any.required": "Mã học sinh là bắt buộc",
});

const maLop = Joi.string().max(10).required().messages({
  "string.empty": "Mã lớp không được để trống",
  "any.required": "Mã lớp là bắt buộc",
});

const maHocKy = Joi.string().max(10).required().messages({
  "string.empty": "Mã học kỳ không được để trống",
  "any.required": "Mã học kỳ là bắt buộc",
});

export const enrollSchema = Joi.object({
  MaHS: maHS,
  MaLop: maLop,
  MaHocKy: maHocKy,
});

export const transferSchema = Joi.object({
  MaHS: Joi.string().required(),
  MaHocKy: Joi.string().required(),
  MaLopCu: Joi.string().required(),
  MaLopMoi: Joi.string().required(),
});

export const summarySchema = Joi.object({
  MaLop: maLop,
  MaHocKy: maHocKy,
});

export const classListQuerySchema = Joi.object({
  MaLop: maLop,
  MaHocKy: maHocKy,
});

export const validate = (schema) => (req, res, next) => {
  const target = req.method === "GET" ? req.query : req.body;
  const { error } = schema.validate(target, { abortEarly: false });

  if (error) {
    return res.status(400).json({
      status: "Error",
      message: "Dữ liệu không hợp lệ",
      details: error.details.map((d) => d.message),
    });
  }

  next();
};
