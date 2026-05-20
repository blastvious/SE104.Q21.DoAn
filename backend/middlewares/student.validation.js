import Joi from 'joi';

export const studentSchema = Joi.object({
    
    HoTen: Joi.string()
        .min(2)
        .max(100)
        .required(),
    GioiTinh: Joi.string()
        .valid("Nam", "Nữ")
        .required(),
    NgaySinh: Joi.date()
        .less("now")
        .required(),
    
    DiaChi: Joi.string()
        .max(200)
        .required(),
    
    Email: Joi.string()
        .email() 
        .max(100)
        .required(),

    SoDienThoai: Joi.string()
        .pattern(/^(0[3|5|7|8|9][0-9]{8})$/)
        .message('Số điện thoại không đúng định dạng VN (phải 10 số, bắt đầu 03/05/07/08/09)')
        .required()
});

export const validateStudent = (req, res, next) => {
    // validate() trả về một object có property 'error'
    const { error } = studentSchema.validate(req.body, { abortEarly: false });

    if (error) {
        return res.status(400).json({
            status: 'Error',
            message: 'Dữ liệu học sinh không hợp lệ',
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

export const validateBulkStudents = (req, res, next) => {
    // Tạo schema cho một danh sách (mảng các học sinh)
    const bulkSchema = Joi.array().items(studentSchema);

    const { error } = bulkSchema.validate(req.body, { abortEarly: false });

    if (error) {
        return res.status(400).json({
            status: 'Error',
            message: 'Dữ liệu file Excel không hợp lệ',
            details: error.details.map(d => d.message)
        });
    }
    next();
};