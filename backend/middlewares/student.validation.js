import Joi from 'joi';

export const studentSchema = Joi.object({
    
    HoTen: Joi.string()
        .min(2)
        .max(100)
        .required(),
    GioiTinh: Joi.string()
        .valid("Nam", "Nu")
        .required(),
    NgaySinh: Joi.date()
        .less("now")
        .required(),
    
    DiaChi: Joi.string()
        .max(200)
        .allow(null, "")
        .required(),
    
    Email: Joi.string()
        .email() 
        .max(100)
        .allow(null, "")
        .required(),

    SoDienThoai: Joi.string()
        .pattern(/^(0[3|5|7|8|9])([0-9]{8})$/) // Regex kiểm tra SĐT Việt Nam
        .message('Số điện thoại không đúng định dạng VN')
        .required()
});

export const validateStudent = (req, res, next) => {
    // validate() trả về một object có property 'error'
    const { error } = studentSchema.validate(req.body, { abortEarly: false });

    if (error) {
        return res.status(400).json({
            status: 'Error',
            message: 'Invalid updated data',
            details: error.details.map(d => d.message)
        });
    }

    
    next();
};

export const validateStudentUpdate = (req, res, next) => {
    const updateSchema = studentSchema.fork(["HoTen", "GioiTinh", "NgaySinh", "DiaChi", "Email", "SoDienThoai"], (s) => s.optional());
    
    const { error } = updateSchema.validate(req.body, { abortEarly: false });

    if (error) {
        return res.status(400).json({
            status: 'Error',
            message: 'Dữ liệu cập nhật không hợp lệ',
            details: error.details.map(d => d.message)
        });
    }
    next();
};