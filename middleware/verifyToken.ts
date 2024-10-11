import { Request, Response, NextFunction } from 'express';
import jwt, { JwtPayload } from 'jsonwebtoken';
interface UserInterface extends JwtPayload {
	id: string;
	username: string;
	email: string;
	role: string;
	// Add any other fields you expect in the token
}

const verifyToken = (req: Request, res: Response, next: NextFunction) => {
	const token = req.headers.authorization?.split(' ')[1];

	if (!token) {
		return res.status(401).json({ message: 'No token provided' });
	}

	jwt.verify(token, `${process.env.SECRETKEY}`, (err, decodedToken) => {
		if (err) {
			return res.status(401).json({ message: 'Token expired or invalid' });
		}
		// Type assertion to UserInterface
		const user = decodedToken as UserInterface;

		// Assign the user details to req.user
		// @ts-ignore
		req.user = user;
		next();
	});
};

export default verifyToken;
