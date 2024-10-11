import jwt from 'jsonwebtoken';

interface ResetTokenInput {
	email: string;
}

const generateResetToken = ({ email }: ResetTokenInput): string => {
	const resetToken = jwt.sign(
		{
			email: email,
			// You can add additional information here if needed
		},
		`${process.env.SECRETKEY}`,
		{ expiresIn: '1h' } // Set the reset token expiration time as needed
	);

	return resetToken;
};

export default generateResetToken;
