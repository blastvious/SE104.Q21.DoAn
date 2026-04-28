import Joi from 'joi';

export const semesterSchema = Joi.object({

    TenHocKy: Joi.string()
        .trim()
        .min(2)
        .max(10)
        .required()
        .messages({
        "string.empty": "Tên học kỳ không được để trống",
        "string.min": "Tên học kỳ phải >= 2 ký tự",
        "string.max": "Tên học kỳ tối đa 10 ký tự"
    })
});

export const validateSemester = (req, res, next) => {
    const {error} = semesterSchema.validate(req.body, {abortEarly: false});

    if (error){
        return res.status(400).json({
            status: 'Error',
            message: 'Invalid updated data',
            details: error.details.map(d => d.message)
        });
    }
    next();
};