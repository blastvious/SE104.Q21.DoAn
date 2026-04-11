import Joi from 'joi';

export const userSchema = Joi.object({
    Username: Joi.string()
        .alphanum()
        .min(3)
        .max(50) 
        .required(),
    
    Password: Joi.string()
        .min(6)
        .max(255)
        .required(),

    RoleName: Joi.string()
        .valid('Admin', 'Manager', 'User') 
});


export const validateUser = (req, res, next) =>{
    const {error} = userSchema.validate(req.body, {abortEarly: false});

    if(error){
        return res.status(400).json({
            status: 'Error',
            message: "Du lieu khong hop le",
            details: error.details.map(d => d.message)
        });
    }
    next();
};

export const validateStudentUpdate = (req, res, next) => {
    
    const updateSchema = userSchema.fork(['Username', 'Password', 'RoleName'], (s) => s.optional());
    
    const { error } = updateSchema.validate(req.body, { abortEarly: false });

    if (error) {
        return res.status(400).json({
            status: 'Error',
            message: 'Invalid updated data',
            details: error.details.map(d => d.message)
        });
    }
    next();
};