import jwt from "jsonwebtoken";

export const verifyToken = (req, res, next) => {
    try {
        
        const token = req.cookies?.jwt;

        if (!token) {
            return res.status(401).json({ message: "Unauthorized" });
        }

        if (!process.env.JWT_KEY) {
            return res.status(500).json({ message: "Server configuration error" });
        }

        const decoded = jwt.verify(token, process.env.JWT_KEY);

        req.userId = decoded.userId;
        req.userEmail = decoded.email;

        return next();
    } catch (err) {
        return res.status(401).json({ message: "Invalid or expired token" });
    }
}