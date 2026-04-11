import db from "../../libs/db.js"


export const createUser = async (req, res) => {
    try {
        const {
            Username,
            Password,
            RoleName
        } = req.body;

        const newUser = await db.PHANQUYEN.create({
            Username,
            Password,
            RoleName
        });
        res.status(201).json(newUser);
    } catch (error) {
        console.error("Error: " ,error);
        res.status(500).json({
            statusCode: 500,
            message: "Error from server"
        });
    }
};