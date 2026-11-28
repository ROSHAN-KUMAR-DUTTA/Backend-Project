import dns from 'dns/promises';
import { ApiError } from './ApiError.js';

const emailValidation = async (email) => {
    try {
        const emailRegex =
            /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
        const domain = email.split('@')[1];
        const record = await dns.resolveMx(domain);
        // console.log(email)

        return emailRegex.test(email) && record.length;
    } catch (error) {
        throw new ApiError(400, 'Email format is wrong');
    }
};

export { emailValidation };
