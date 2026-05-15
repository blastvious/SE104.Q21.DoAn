import roles from "../src/role.js";

const checkRole = (permission) => {
    return (req, res, next) => {
        const userRole = req.user.role;

        if (!roles[userRole]) {
            return res.status(403).json({ message: "Role không hợp lệ" });
        }

        if (!roles[userRole].can.includes(permission)) {
            return res.status(403).json({ message: "Không có quyền" });
        }

        next();
    };
};

export default checkRole;