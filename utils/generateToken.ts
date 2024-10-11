import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
interface userInput {
	username:string;
	email: string;
	role:string
}
const generateToken = ({ username, email, role }: userInput) => {
	const token = jwt.sign(
		{
			username:username,
			email: email,
			role:role
		},
		`${process.env.SECRETKEY}`,
		{ expiresIn: '30d' } // Set the token expiration time as needed
	);

	return token;
};
export default generateToken;
